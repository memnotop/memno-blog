---
title: 高性能矩阵乘ip设计--龙芯中科杯
description: 参加比赛的一些记录
publishDate: 2026-07-18 23:19:01
tags:
  - technical
repositories:
  - technical
heroImageSrc: ../../../../../public/img/covers/集创.png
heroImageAlt: 封面图说明
heroImageColor: "#659EB9"
showHeroImage: true
language: "中文"
draft: false
---

<!-- 这里先写一句你想表达的核心观点。 -->

## 赛题
参赛者需要基于分赛区决赛发布包实现一个简单 SoC，并运行用户程序 `user-sample.bin`。用户程序通过串口输出规定的开始标识后，从 ExtRAM 读取 5000 组 4 x 4 无符号矩阵乘法输入数据，完成全部矩阵乘法后，计算完整结果区的 CRC 32 校验码，并通过串口输出规定的 CRC 32 校验码 和结束标识。

每组计算为：

```cpp
C = A * B
```

其中 `A`、`B`、`C` 都是 4 x 4 矩阵。`A` 和 `B` 的元素为 32-bit 无符号数，`C` 的每个元素为 66-bit 无符号结果。

**串口标识要求**

用户程序必须配置串口输出，波特率为 115200。

在读取 Extram 中数据、进入矩阵乘法主循环前，必须先输出：

```cpp
MATMUL_START
```

完成全部 5000 组矩阵乘法并计算结果 CRC 32 后，必须在 `MATMUL_DONE` 之前输出：

```cpp
MATMUL_CRC32=XXXXXXXX
```

其中 `XXXXXXXX` 是 8 位十六进制 CRC 32，可以使用大写或小写字母，不要带 `0x` 前缀。

输出 CRC 32 后，必须输出：

```cpp
MATMUL_DONE
```

## 矩阵乘
对于 4 x 4 的矩阵 C，一个元素对应矩阵 A 的四个元素和 B 的四个元素分别相乘再相加，共 4 次乘法、一次加法。所以一共有 64 次乘法。

本设计考虑两种框架：64 路乘法和 16 路乘法，分别代表多少组乘法同时计算。

这里 c 矩阵寄存器定义为 `reg [65:0] c_mem [0:15];`，共 16 个好理解，但是位宽为什么是 66 呢？32 位乘法的结果是 64 位，四个 64 位的结果累加得到了 c 的每一项，故有 66 位。

66 位带来了一个问题，ExtRAM 一次只存一个字（32bit）此时需要拆分位 3 段。以下代码实现了此功能：
```verilog
function [31:0] c_word_by_part;
    input [65:0] c_value;
    input [1:0]  part;
begin
    case (part)
        2'd0: c_word_by_part = c_value[31:0];
        2'd1: c_word_by_part = c_value[63:32];
        default: c_word_by_part = {30'b0, c_value[65:64]};
    endcase
end
endfunction
```

因此一组矩阵的数据量为：A，16 word；B，16 word；C，48 word；共 320 Byte。

## IP 整体结构

```text
                    CPU
                     │
              AXI Slave 寄存器
                     │
        ┌────────────▼────────────┐
        │       控制寄存器         │
        │ SRC / DST / GROUPS      │
        │ START / BUSY / DONE     │
        └────────────┬────────────┘
                     │
              控制状态机 FSM
                     │
       ┌─────────────┼─────────────┐
       │             │             │
       ▼             ▼             ▼
   输入读取       矩阵计算       结果写回
   DMA/ExtRAM     乘法与累加      DMA/ExtRAM
       │             │             │
       ▼             ▼             ▼
    A/B缓冲区      C缓冲区       CRC32计算
```

### 1. 控制：AXI Slave

CPU 通过地址访问 IP 的寄存器：
```text
0x00 CTRL       启动
0x04 STATUS     done/busy/error
0x08 SRC_BASE   输入地址
0x0c DST_BASE   输出地址
0x10 GROUPS     矩阵组数
0x14 CUR_GROUP  当前组
0x18 CYCLES     执行周期
0x1c CRC32      结果校验
```

在 CPU 看来，它向内存中写入数据，实际上，通过 AXI 地址译码后，写入的是 IP 内部寄存器。

例：CPU 地址 `0xbf50_0000` 对应 IP 的 `CTRL` 寄存器。

### 2. 数据：DMA 或直接 ExtRAM 接口

CPU 只告诉 IP：

```text
输入在哪里
输出写到哪里
一共有多少组
```
之后 IP 自己从 ExtRAM 读取 A/B、计算、写回 C。

DMA 硬件主动搬运数据，而不需要经过 CPU 内部。

我们早期通过 AXI Master DMA来访问 ExtRAM，后续 ip直接访问 ExtRAM，减少了 AXI 适配器产生的空拍。

### 3. 输入缓冲区
基本版使用：

```verilog
reg [31:0] a_mem [0:15];
reg [31:0] b_mem [0:15];
```

优化版使用两套缓冲：

```verilog
reg [31:0] a_buf0 [0:15];
reg [31:0] b_buf0 [0:15];
reg [31:0] a_buf1 [0:15];
reg [31:0] b_buf1 [0:15];
```

两套缓冲就是 Ping-Pong Buffer：

```text
计算第 n 组时：
    buf0 → 计算
    buf1 ← 读取第 n+1 组

第 n 组结束后交换：
    buf1 → 计算
    buf0 ← 读取第 n+2 组
```

这样可以把“读内存”和“做计算”重叠起来。

### 4. 计算核心
核心包含：

```verilog
reg [65:0] c_mem     [0:15];
reg [63:0] mul_acc   [0:15];
reg [63:0] mul_mcand [0:15];
reg [31:0] mul_mult  [0:15];
```

含义分别是：

- `c_mem`：16 个最终输出
- `mul_acc`：当前乘法的部分积累加值
- `mul_mcand`：multiplicand，被乘数 A
- `mul_mult`：multiplier，乘数 B

### 5. 控制状态机 FSM
代码把整个工作过程拆成状态：

```verilog
ST_IDLE
ST_READ_REQ
ST_READ_DATA
ST_COMPUTE_INIT
ST_COMPUTE_RUN
ST_SUM
ST_WRITE_PREP
ST_WRITE_SEND
ST_WRITE_RESP
ST_NEXT_GROUP
ST_ERROR
```

FSM 是有限状态机，可以理解为硬件的“流程管理员”：

```text
IDLE
  ↓ 收到 start
READ_REQ
  ↓ 发出读地址
READ_DATA
  ↓ 收完 A/B
COMPUTE_INIT
  ↓ 初始化乘法器
COMPUTE_RUN
  ↓ 完成计算
SUM
  ↓ 准备结果
WRITE_SEND
  ↓ 写回 48 个 word
WRITE_RESP
  ↓ 判断是否还有下一组
NEXT_GROUP 或 IDLE
```

## 乘法的硬件实现
### 移位、加法实现 32 位乘法
题目要求 DSP 使用量为 0，因此不能简单写一个大规模并行的：

```verilog
result <= a * b;
```

所以采用分段移位加法。

把 B 分为 四个 8 bit：

```text
B = b0 + b1×2^8 + b2×2^16 + b3×2^24
```

计算过程：
$$
A\times B =A\times b_0+(A\times b_1)\ll 8+(A\times b_2)\ll 16+(A\times b_3)\ll 24
$$

代码中的主要操作是：

```verilog
mul_acc   = mul_acc + 当前8bit部分积;
mul_mcand = mul_mcand << 8;
mul_mult  = mul_mult >> 8;
```

`mul_part8` 又把一个 8 bit 数拆成两个 4 bit：

```verilog
mul_part8 =
    mul_part4(base, digit[3:0]) +
    mul_part4(base << 4, digit[7:4]);
```

而 `mul_part4` 用移位和加法构造 `base × 0~15`。

例如：

```text
base × 5 = base + base × 4
         = base + (base << 2)

base × 10 = base × 2 + base × 8
          = (base << 1) + (base << 3)
```

这就是“移位加法乘法器”。

### 核心寄存器
单个乘法通道包含：

```verilog
reg [63:0] mul_acc;
reg [63:0] mul_mcand;
reg [31:0] mul_mult;
```

它们分别表示：

`mul_acc`

Partial product accumulator，部分积累加器。

```text
已经计算完成的部分结果
```

最终它会得到完整的 64 bit 乘积。

`mul_mcand`

Multiplicand，被乘数。

它保存 A，并在每拍之后左移 8 bit：

```text
第0拍：A
第1拍：A << 8
第2拍：A << 16
第3拍：A << 24
```

它是 64 bit，因为左移后的结果可能超过 32 bit。

`mul_mult`

Multiplier，乘数。

它保存 B，并在每拍之后右移 8 bit：

```text
第0拍：B
第1拍：B >> 8
第2拍：B >> 16
第3拍：B >> 24
```

所以 `mul_mult[7:0]` 始终是当前需要处理的 8 bit 分段。

整个过程可以写成伪代码：

```c
acc   = 0;
mcand = A;
mult  = B;

重复4次 {
    acc   = acc + mcand * mult[7:0];
    mcand = mcand << 8;
    mult  = mult >> 8;
}
```

这里的 `mcand * mult[7:0]` 仍然不能直接使用乘法器，所以还要继续拆分。

### 拆分：8 位拆为两个 4 位
8 bit 数可以继续拆成高低两个 4 bit：

```text
digit = {digit_hi, digit_lo}
```

数学上：

$digit=digit_{lo}+digit_{hi}\times 16$


因此：
$$
base\times digit=base\times digit_{lo}+(base\ll 4)\times digit_{hi}
$$

对应代码：

```verilog
function [63:0] mul_part8;
    input [63:0] base;
    input [7:0]  digit;
    reg [63:0]   base_hi4;
begin
    base_hi4  = {base[59:0], 4'b0};

    mul_part8 =
        mul_part4(base, digit[3:0]) +
        mul_part4(base_hi4, digit[7:4]);
end
endfunction
```

其中：

```verilog
base_hi4 = base << 4;
```

所以：

```verilog
mul_part4(base, digit[3:0])
```

计算低 4 bit，而：

```verilog
mul_part4(base << 4, digit[7:4])
```

计算高 4 bit。

**数值例子**

假设：

```text
base  = 10
digit = 0x25
```

`0x25` 可以拆成：

```text
低4bit = 5
高4bit = 2
```

因此：

```text
10 × 0x25
= 10 × 5 + (10 << 4) × 2
= 50 + 160 × 2
= 370
```

而：

```text
0x25 = 37
10 × 37 = 370
```

结果一致。

### 4 位乘法实现

基础函数：

```verilog
function [63:0] mul_part4;
    input [63:0] base;
    input [3:0]  digit;
begin
    case (digit)
        4'h0: mul_part4 = 64'b0;
        4'h1: mul_part4 = base;
        4'h2: mul_part4 = {base[62:0], 1'b0};
        4'h3: mul_part4 = base + {base[62:0], 1'b0};
        4'h4: mul_part4 = {base[61:0], 2'b0};
        ...
    endcase
end
endfunction
```

`digit` 只有 4 bit，因此取值是 0～15。

以几个分支为例。

**乘以 2**

```verilog
4'h2: mul_part4 = {base[62:0], 1'b0};
```

拼接操作：

```verilog
{base[62:0], 1'b0}
```

相当于：

```verilog
base << 1
```

也就是 `base × 2`。

**乘以 3**

```verilog
4'h3: mul_part4 =
    base + {base[62:0], 1'b0};
```

相当于：

```text
base + base×2 = base×3
```

**乘以 6**

```verilog
4'h6: mul_part4 =
    {base[62:0], 1'b0} +
    {base[61:0], 2'b0};
```

相当于：

```text
base×2 + base×4 = base×6
```

**乘以 15**

```verilog
base
+ (base << 1)
+ (base << 2)
+ (base << 3)
```

也就是：

```text
base × (1 + 2 + 4 + 8)
= base × 15
```

因此 `mul_part4(base, digit)` 的功能是：


$mul\_part 4(base,digit)=base\times digit$


但是 RTL 中没有使用乘法运算符，只使用了：

- 加法器
- 左移
- 多路选择器
- LUT

### 完整的四周期例子

取一个容易观察的例子：

```text
A = 3
B = 0x04030201
```

把 B 拆成四个字节：

```text
b0 = 0x01
b1 = 0x02
b2 = 0x03
b3 = 0x04
```

因此：
$$
3\times B
=
3\times1+
(3\times2)\ll8+
(3\times3)\ll16+
(3\times4)\ll24
$$

**初始化**

```text
mul_acc   = 0
mul_mcand = 0x0000000000000003
mul_mult  = 0x04030201
```

**第 0 拍：处理 `0x01`**

当前：

```text
mul_mult[7:0] = 0x01
```

部分积：

```text
mul_mcand × 1 = 0x00000003
```

更新：

```text
mul_acc = 0x00000003
```

然后：

```text
mul_mcand <<= 8
mul_mult  >>= 8
```

得到：

```text
mul_mcand = 0x0000000000000300
mul_mult  = 0x00040302
```

**第 1 拍：处理 `0x02`**

部分积：

```text
0x00000300 × 2 = 0x00000600
```

累加：

```text
mul_acc
= 0x00000003 + 0x00000600
= 0x00000603
```

移位后：

```text
mul_mcand = 0x0000000000030000
mul_mult  = 0x00000403
```

**第 2 拍：处理 `0x03`**

部分积：

```text
0x00030000 × 3 = 0x00090000
```

累加：

```text
mul_acc
= 0x00000603 + 0x00090000
= 0x00090603
```

移位后：

```text
mul_mcand = 0x0000000003000000
mul_mult  = 0x00000004
```

**第 3 拍：处理 `0x04`**

部分积：

```text
0x03000000 × 4 = 0x0c000000
```

累加：

```text
mul_acc
= 0x00090603 + 0x0c000000
= 0x0c090603
```

检查：

```text
0x04030201 × 3 = 0x0c090603
```

结果正确。

四拍的数据变化如下：

|  拍数 | 当前 digit | `mul_mcand` |     加入的部分积 |       累加结果 |
| --: | -------: | ----------: | ---------: | ---------: |
|   0 |     `01` |  `00000003` | `00000003` | `00000003` |
|   1 |     `02` |  `00000300` | `00000600` | `00000603` |
|   2 |     `03` |  `00030000` | `00090000` | `00090603` |
|   3 |     `04` |  `03000000` | `0c000000` | `0c090603` |
|     |          |             |            |            |

### 对应到 RTL 状态机

16 路版本在 `ST_COMPUTE_INIT` 中处理第一个字节：

```verilog
mul_acc[prod_i] =
    mul_part8(
        {32'b0, a_mem[(row_i << 2)]},
        b_mem[col_i][7:0]
    );
```

这里：

```verilog
{32'b0, a_mem[...]}
```

是把 32 bit 的 A 零扩展成 64 bit。

同时准备后面的三个字节：

```verilog
mul_mcand[prod_i] =
    {24'b0, a_mem[(row_i << 2)], 8'b0};

mul_mult[prod_i] =
    {8'b0, b_mem[col_i][31:8]};
```

注意这里已经把 A 左移 8 bit，也把 B 右移 8 bit，因为第 0 个字节已经计算完了。

因此进入 `ST_COMPUTE_RUN` 时，寄存器已经指向第 1 个字节。

在 RUN 状态中：

```verilog
mul_acc[prod_i] =
    mul_acc[prod_i] +
    mul_part8(
        mul_mcand[prod_i],
        mul_mult[prod_i][7:0]
    );
```

然后继续移位：

```verilog
mul_mcand[prod_i] =
    {mul_mcand[prod_i][55:0], 8'b0};

mul_mult[prod_i] =
    {8'b0, mul_mult[prod_i][31:8]};
```

分别对应：

```text
mul_mcand <<= 8
mul_mult  >>= 8
```
## 设计版本一：64 路全展开
最初版本的核心数组是：

```verilog
reg [63:0] mul_acc   [0:63];
reg [63:0] mul_mcand [0:63];
reg [31:0] mul_mult  [0:63];
```

为什么是 64 路？

```text
16 个 C 元素
每个 C 有 4 个乘积
16 × 4 = 64
```

因此：

```text
C[0][0] 的4个乘积 → 4路
C[0][1] 的4个乘积 → 4路
...
C[3][3] 的4个乘积 → 4路
```

64 个乘法器同时工作。每个乘法器每周期处理 8 bit，约 4 拍后得到所有 64 个乘积，再把每四个乘积相加。

优点：

- 计算延迟很低
- 结构直观
- 所有 k 项完全并行

缺点：

- 需要 64 套部分积逻辑
- 同时存在大量宽位加法
- A/B 数据需要扇出到很多地方
- 路由拥塞非常严重
- 可能导致实现时间很长甚至无法完成布线

项目中实际遇到的不是功能错误，而是：

```text
Congestion is preventing the router from routing all nets
```

也就是说，逻辑功能正确，但 FPGA 内部的连线放不下或难以布通。

## 设计版本二：16 路输出并行
为解决拥塞，版本二把乘法器从 64 路降到 16 路：

```verilog
reg [63:0] mul_acc   [0:15];
reg [63:0] mul_mcand [0:15];
reg [31:0] mul_mult  [0:15];
```

现在每个 C 元素对应一条计算通道：

```text
通道0 计算 C[0][0]
通道1 计算 C[0][1]
...
通道15计算 C[3][3]
```

但一条通道需要依次计算：

```text
k=0：A[i][0] × B[0][j]
k=1：A[i][1] × B[1][j]
k=2：A[i][2] × B[2][j]
k=3：A[i][3] × B[3][j]
```

所以增加了：

```verilog
reg [1:0] prod_k;
```

`prod_k` 表示当前正在处理哪个 k。

大体流程变成：

```text
16 路同时计算所有 C[i][j] 的 k=0
↓
累加到对应 c_mem
↓
16 路同时计算 k=1
↓
继续累加
↓
k=2
↓
k=3
↓
完成16个C元素
```

这是一种时间复用：

> 同一套乘法硬件在不同时间计算多个乘积，用更多周期换取更少资源和更容易布线。

对比起来：

| 架构 | 乘法通道 | k 的处理方式 | 主要特点 |
|---|---:|---|---|
| 64 路版 | 64 | 4 个 k 全并行 | 延迟低、拥塞大 |
| 16 路版 | 16 | 4 个 k 顺序执行 | 周期增加、布线明显缓解 |
| 更低并行度 | 4/8 | 行、列和 k 都复用 | 资源少但吞吐低 |

16 路版本在项目中成功把远端严重的路由拥塞问题压了下来，并保持 DSP=0。

