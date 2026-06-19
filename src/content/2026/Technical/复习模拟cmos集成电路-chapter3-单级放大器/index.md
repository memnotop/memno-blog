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



