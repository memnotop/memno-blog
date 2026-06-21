---
title: 复习：模拟cmos集成电路-chapter3-单级放大器
description: 一句话摘要
publishDate: 2026-06-16 16:28:31
tags:
  - technical
repositories:
  - technical
heroImageSrc: ../../../../../public/img/covers/cmos.webp
heroImageAlt: 封面图说明
heroImageColor: "#659EB9"
showHeroImage: true
language: 中文
draft: false
---

<!-- 这里先写一句你想表达的核心观点。 -->

## 目标
1. 能说明需要放大器的原因、理想放大器的特点
2. 能说明我们关心的放大器的特性及其原因
3. 能分析电阻为负载的共源级放大器的大信号特性、小信号增益和输入输出电阻
4. 能利用输出特性曲线和 $I_{D}-V_{OUT}$ 曲线分析增益和输入摆幅的矛盾
5. 能分析二极管连接为负载的共源级放大器的大信号特性、小信号增益、小信号输入输出电阻
6. 能分析电流源为负载的共源级放大器的大信号特性。小信号增益、小信号输入出电阻
7. 能说明共源级放大器的万能分析法


## 需要掌握的放大器类型

![[Pasted image 20260616164213.png]]

## 共源极
**电压**---跨导--->**电流**---电阻--->**电压**

### 电阻负载

$V_{in}-V_{out}曲线$

![[Pasted image 20260616164919.png]]

需要工作在饱和区，若不在饱和区：

![[Pasted image 20260616165040.png]]

增益 $A_{v}$ 会下降

饱和区的范围

![[Pasted image 20260618085226.png]]

饱和区时，沟道被夹断，$V_{DS}>=V_{GS}-V_{TH}$，其中，$V_{DS}$ 是 $V_{out}$ ，$V_{GS}$ 是 $V_{in}$

**增益计算**

- 饱和区

$V_{out}=V_{DD}-R_{D} \frac{1}{2}\mu_{n}C_{ox} \frac{W}{L}(V_{in}-V_{TH})^{2}$

$A_{v} = \frac{\partial V_{out}}{\partial V_{in}} = -R_{D}\mu_{n}C_{ox}\frac{W}{L}(V_{in}-V_{TH})= -g_{m}R_{D}$

饱和区增益随输入电压线性增加

- 线性区

$A_{v}=\frac{\partial V_{out}}{\partial V_{in}}=-\frac{\mu_{n}C_{ox}（\frac{W}{L}）R_{D}V_{out}}{1+\mu_{n}C_{ox}(\frac{W}{L})R_{D}(V_{in}-V_{TH}-V_{out})}$

两者图像为：

![[Pasted image 20260618092815.png]]

其中 $V_{in1}$ 是饱和区和线性区的分界

**小信号分析**

![[Pasted image 20260618110824.png]]

### 二极管负载

二极管特性：栅漏相连，电势相同（$V_{gs}=0$ ），所以总处于饱和区。

测量等效阻抗

![[Pasted image 20260618114920.png]]

可知，$\frac{V_{X}}{I_{X}}=\frac{1}{g_{m}}||r_{o}\approx \frac{1}{g_{m}}$

考虑到体效应

![[Pasted image 20260618115839.png]]

$V_{1}=-V_{x}$

$I_{x}=-g_{m}V_{1}-\frac{V_{1}}{r_{o}}-g_{mb}V_{bs}$

$\Rightarrow I_{x}=g_{m}V_{x}+\frac{V_{x}}{r_{o}}+g_{mb}V_{x}$

故，$\frac{V_{x}}{I_{x}}=\frac{1}{g_{m}}||r_{o}||\frac{1}{g_{mb}}\approx \frac{1}{g_{m}+g_{mb}}$

> 体效应：体端接地，?？

**增益的小信号推导**

我们将其视作一个电阻，不难得到：

$A_{v}=-g_{m1}\frac{1}{g_{m2}+g_{mb2}}=-\frac{g_{m1}}{g_{m2}}\frac{1}{1+\eta}$  $(\eta = \frac{g_{mb2}}{g_{m2}})$

进一步地：

$A_{v}=-\frac{\sqrt{2\mu_{n}C_{ox}(W/L)_{1}I_{D1}}}{\sqrt{2\mu_{n}C_{ox}(W/L)_{2}I_{D2}}}\frac{1}{1+\eta}$

由于 $I_{D1}=I_{D2}$

所以 $A_{v}=-\sqrt{\frac{(W/L)_{1}}{(W/L)_{2}}}\frac{1}{1+\eta}$

**特性**

可以看出，若忽略 $\eta$ 随电压的变化，增益没有随电压变化，只与晶体管的长宽比之比相关，表示输入-输出呈线性。

**增益的偏导推导**

![[Pasted image 20260618152146.png]]

电流相等：

$\frac{1}{2}\mu_{n}C_{ox}(\frac{W}{L})_{1}(V_{in}-V_{TH1})^{2}=\frac{1}{2}\mu_{n}C_{ox}(\frac{W}{L})_{2}(V_{DD}-V_{out}-V_{TH2})^{2}$ 

两边求根：

$\sqrt{(\frac{W}{L})_{1}}(V_{in}-V_{TH1})=\sqrt{(\frac{W}{L})_{2}}(V_{DD}-V_{out}-V_{TH2})$

两边对 $V_{in}$ 求偏导：

$\sqrt{(\frac{W}{L})_{1}}=\sqrt{(\frac{W}{L})_{2}}(-\frac{\partial V_{out}}{\partial V_{in}}-\frac{\partial V_{TH2}}{\partial V_{in}})$

> 为什么 $V_{TH1}$ 不随 $V_{in}$ 变化？因为 M 1 没有体效应，而 M 2 有。

链式法则：

![[Pasted image 20260618153446.png]]

最终依然有

$A_{v}=-\sqrt{\frac{(W/L)_{1}}{(W/L)_{2}}}\frac{1}{1+\eta}$

**输入输出分析**

![[Pasted image 20260618154022.png]]

分为三个阶段，$V_{in}<V_{TH1}$ 时，$V_{out}=V_{DD}-V_{TH2}$；$V_{TH1}<V_{in}<V_{out}+V_{TH1}$ 时，$V_{out}$ 近似线性变化；$V_{in}>V_{out}+V_{TH1}$ 进入线性区，呈非线性变化。


### 电流源负载

![[Pasted image 20260618155456.png]]

从 $V_{out}$ 看输出阻抗：

向上为 $r_{o1}$，向下为 $r_{o2}$，相并为 $r_{o1}||r_{o2}$

所以增益为：

$A_{v}=-g_{m1}(r_{o1}||r_{o2})$

**比较电阻负载和电流源负载**

输出电压的摆幅

![[Pasted image 20260619111332.png]] 

当 $V_{in}$ 下降到接近 $V_{TH1}$ 时，最大输出电阻接近 $V_{DD}$ 或 $V_{DD}-|V_{GS2}-V_{TH2}|$

电流源负载共源极**摆幅较小**，但是总能具有**较高**的增益

### 有源负载

![[Pasted image 20260619111905.png]]

$V_{in}$ 增加会产生两个变化：

1. $I_{D1}$ 增加，把 $V_{out}$ 拉低；

2. $M_{2}$ 向输出节点注入电流减小，允许 $V_{out}$ 下降。

两个变化互相增强，其增益更大。

**增益分析**

等效跨导：$g_{m1}+g_{m2}$

等效输出电阻：$r_{o1}+r_{o2}$

故 $A_{v}=-(g_{m1}+g_{m2})(r_{o1}||r_{o2})$

### 带源极负反馈

![[Pasted image 20260620155113.png]]

等效跨导：

$G_{m}=\frac{g_{m}}{1+g_{m}R_{s}}$

$A_{v}=-G_{m}R_{D}$

**小信号分析**

![[Pasted image 20260620155317.png]]

此时的电流

$I_{out}=g_{m}V_{1}-g_{mb}V_{X}-\frac{I_{out}R_{s}}{r_{o}}=g_{m}(V_{in}-I_{out}R_{s})+g_{mb}(-I_{out}R_{s})-\frac{I_{out}R_{s}}{r_{o}}$

故 $G_{m}=\frac{I_{out}}{V_{in}}=\frac{g_{m}r_{o}}{R_{s}+[1+(g_{m}+g_{mb})R_{s}]r_{o}}$

**源极负反馈的线性性**

![[Pasted image 20260620160708.png]]

图 a 中，可以看到不带源极负反馈的 $g_{m}$ 变化情况。当 $\frac{1}{g_{m}}<<R_{s}$ 时，$G_{m}\approx \frac{1}{R_{s}}$，此时近视线性。

**二极管做负反馈电阻**

![[Pasted image 20260620161831.png]]

为什么这里是 $\frac{1}{g_{m2}}$？实际上是 $r_{o2}||\frac{1}{g_{m2}}$，其中，$r_{o2}>>\frac{1}{g_{m2}}$，故而近似于 $\frac{1}{g_{m2}}$ 。

在栅固定，从漏极看输出电阻时，电阻为 $r_{o}$，本质原因是 $v_{gs}=0$。

**输出电阻**

![[Pasted image 20260620163113.png]]

$V_{1}=-I_{x}R_{s}$

$流过r_{o}的电流是I_{x}-(g_{m}+g_{mb})V_{1}=I_{x}+(g_{m}+g_{mb})R_{s}I_{x}$

$V_{x}=r_{o}[I_{x}+(g_{m}+g_{mb})R_{s}I_{x}]+I_{x}R_{s}$

$\Rightarrow R_{out}=[1+(g_{m}+g_{mb})R_{s}]r_{o}+R_{s}$

相当于是 $r_{o}$ 变为了 $1+(g_{m}+g_{mb})$ 倍。

### 辅助定理

![[Pasted image 20260620164428.png]]

$A_{v}=-G_{m}R_{out}$

其中，$G_{m}=I_{out}V_{in}$


## 源随器

### 电阻偏置

![[Pasted image 20260620204254.png]]

**增益求解**

由输入输出特性：

$V_{out}=\frac{1}{2}\mu_{n}C_{ox}\frac{W}{L}(V_{in}-V_{TH}-V_{out})^{2}R_{s}$

对 $V_{in}$ 求偏导

$\frac{1}{2}\mu_{n}C_{ox}\frac{W}{L}2(V_{in}-V_{TH}-V_{out})(1-\frac{\partial V_{TH}}{\partial V_{in}}-\frac{\partial V_{out}}{\partial V_{in}})R_{s}=\frac{\partial V_{out}}{\partial V_{in}}$

由于 $\partial V_{TH}/\partial V_{SB}=(\partial V_{TH}/\partial V_{SB})(\partial V_{SB}/\partial V_{in})=\eta \partial V_{out}/\partial V_{in}$

故：$\frac{\partial V_{out}}{\partial V_{in}}=\frac{\mu_{n}C_{ox}\frac{W}{L}(V_{in}-V_{TH}-V_{out})R_{S}}{1+\mu_{n}C_{ox}\frac{W}{L}(V_{in}-V_{TH}-V_{out})R_{S}(1+\eta)}$

故而，$A_{v}=\frac{g_{m}R_{s}}{1+(g_{m}+g_{mb})R_{s}}$

**小信号求解**

![[Pasted image 20260620205653.png]]

$V_{in}-V_{1}=V_{out}，V_{bs}=-V_{out}$

故：$g_{m}V_{1}-g_{mb}V_{out}=V_{out}/R_{S}$

可以得到：$V_{out}/V_{in}=g_{m}R_{S}/[1+(g_{m}+g_{mb})R_{S}]$

![[Pasted image 20260620210357.png]]

$\eta = \partial V_{TH} /\partial V_{SB}$

其随 $V_{out}$ 增大，变化越来越小，最终接近 1。

### 电流源偏置

输出阻抗计算

![[Pasted image 20260620211224.png]]

由图所示，从下向上看，$R_{out}=\frac{1}{g_{m}+g_{mb}}$

**戴维南等效电路（不解）**

当 $R_{S}=\infty$ 时，增益为：

$A_{v}=\frac{\frac{1}{g_{mb}}}{\frac{1}{g_{m}}+\frac{1}{g_{mb}}}$

![[Pasted image 20260621194037.png]]

驱动源随器的往往是有限负载

![[Pasted image 20260621194237.png]]

$A_{v}=\frac{R_{eq}}{R_{eq}+\frac{1}{g_{m}}}$

其中 $R_{eq}=(1/g_{mb})||r_{O1}||r_{O2}||R_{L}$

**例题**

![[Pasted image 20260621205220.png]]
## 共栅级

![[Pasted image 20260621205909.png]]

**小信号增益公式求解**

$I_{D}=\frac{1}{2}\mu_{n}C_{ox}\frac{W}{L}(V_{b}-V_{in}-V_{TH})^2$

$V_{out}=V_{DD}-\frac{1}{2}\mu_{n}C_{ox}\frac{W}{L}(V_{b}-V_{in}-V_{TH})^{2}R_{D}$

$A_{v}=\frac{\partial V_{out}}{\partial V_{in}}=-\mu_{n}C_{ox}\frac{W}{L}(V_{b}-V_{in}-V_{TH})(-1-\frac{\partial V_{TH}}{\partial V_{in}})R_{D}$

其中，$\partial V_{TH}/\partial V_{in}=\partial V_{TH}/\partial V_{SB}=\eta$

故：$A_{v}=g_{m}(1+\eta)R_{D}$



## 共源共栅级

