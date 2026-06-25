---
title: 复习：模拟cmos集成电路-chapter4差动放大器
description: 一句话摘要
publishDate: 2026-06-22 20:59:47
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

## 单端与差动的工作方式
![[Pasted image 20260623114359.png]]
差动对可以降低噪声的影响

如图所示，如果是电源的跃变，会导致形成一个突出的信号，通过差动的耦合，可以使电路有更好的抗干扰能力。

**降低电源噪声**

![[Pasted image 20260623114730.png]]

如果 $V_{DD}$ 变化了 $\Delta V$，则 $V_{out}$ 几乎有相同的变化，但是使用噪声会同时印象 $V_{X}$ 和 $V_{Y}$，但不影响 $V_{X}-V_{Y}$

## 基本差动对

### 简要介绍

输入共模电平会影响到晶体管的饱和与截止，实际上相当于大信号。

![[Pasted image 20260623142833.png]]

如何解决这些问题呢

引入一个电流源 $I_{SS}$

![[Pasted image 20260623142903.png]]

### 定性分析

![[Pasted image 20260623155630.png]]

开始 $V_{in1}$ 小，M 1 截止，故而 $V_{out1}=V_{DD}$。图像两边对称，$V_{in1}=V_{in2}$ 时，$V_{out1}=V_{out2}=V_{DD}-\frac{R_{D}I_{SS}}{2}$

**共模特性分析**

![[Pasted image 20260623161344.png]]

$V_{b}$ 这里是一个电流源。

首先令 $V_{in1}=V_{in2}=V_{in,CM}$，使 $V_{in,CM}$ 从 0 变化到 $V_{DD}$

![[Pasted image 20260623161305.png]]

当 $V_{in,CM}=0$ 时，$I_{D1}=I_{D2}=0$，所以 $I_{D3}=0$，故而 $V_{P}=0$

当 $V_{in,CM}>=V_{TH}$ 时，$M_{1}，M_{2}$ 导通，$I_{D1},I_{D2}$ 持续上升，$V_{P}$ 也会上升，此时相当于 $M_{1},M_{2}$ 组成了一个源随器。

当 $V_{in,CM}>=V_{GS1}+(V_{GS3}-V_{TH3})$ 时，此时 $M3$ 的漏源电压大于 $V_{GS3}-V_{TH3}$，故而 $M_{3}$ 处于饱和态，流过 $M_{1},M_{2}$ 的电流之和保持一个常数。

范围： $V_{GS1}+(V_{GS3}-V_{TH3})<=V_{in,CM}<=min[V_{DD}-R_{D}\frac{I_{SS}}{2}+V_{TH},V_{DD}]$

### 定量分析

#### 大信号分析

![[Pasted image 20260623170522.png]]

$V_{out1}=V_{DD}-R_{D1}I_{D1}, V_{out2}=V_{DD}-R_{D2}I_{D2}$

假如 $R_{D1}=R_{D2}=R_{D}$ ，则有 $V_{out1}-V_{out2}=R_{D}(I_{D2}-I_{D1})$

由于 $M_{1}M_{2}$ 的源极电压为 $V_{P}$ 所以 $V_{in1}-V_{GS1}=V_{in2}-V_{GS2}$，故 $V_{in1}-V_{in2}=V_{GS1}-V_{GS2}$

由于平方律 $(V_{GS}-V_{TH})^{2}=\frac{I_{D}}{\frac{1}{2}\mu_{n}C_{ox}\frac{W}{L}}$

$V_{GS}=\sqrt{\frac{2I_{D}}{\mu_{n}C_{ox}\frac{W}{L}}}+V_{TH}$

$V_{in1}-V_{in2}=\sqrt{\frac{2I_{D1}}{\mu_{n}C_{ox}\frac{W}{L}}}-\sqrt\frac{2I_{D2}}{\mu_{n}C_{ox}\frac{W}{L}}$

同时平方，考虑到 $I_{D1}+I_{D2}=I_{SS}$ ，可得

$(V_{in1}-V_{in2})^{2}=\frac{2}{mu_{n}C_{ox}\frac{W}{L}}(I_{SS}-2\sqrt{I_{D1}I_{D2}})$ 

即有 $\frac{1}{2}\mu_{n}C_{ox}\frac{W}{L}(V_{in1}-V_{in2})^{2}-I_{SS}=-2\sqrt{I_{D1}I_{D2}}$

再次将两边平方，留意到：$4I_{D1}I_{D2}=(I_{D1}+I_{D2})^{2}-(I_{D1}-I_{D2})^{2}=I_{SS}^{2}-(I_{D1}-I_{D2})^{2}$,可得：

$(I_{D1}-I_{D2})^{2}=-\frac{1}{4}(\mu_{n}C_{ox}\frac{W}{L})^{2}(V_{in1}-V_{in2})^{4}+I_{SS}\mu_{n}C_{ox}\frac{W}{L}(V_{in1}-V_{in2})^{2}$

因此：$I_{D1}-I_{D2}=\sqrt{\mu_{n}C_{ox}\frac{W}{L}I_{SS}}(V_{in1}-V_{in2})\sqrt{1-\frac{\mu_{n}C_{ox}(W/L)}{4I_{SS}}(V_{in1}-V_{in2})^{2}}$

**增益分析**

$\frac{\partial \Delta I_{D}}{\partial \Delta V_{in}}=\frac{1}{2}\mu_{n}C_{ox}\frac{W}{L}\frac{\frac{4I_{SS}}{\mu_{n}C_{ox}\frac{W}{L}}-2\Delta V_{in}^{2}}{\sqrt{\frac{4I_{SS}}{\mu_{n}C_{ox}\frac{W}{L}}}-\Delta V_{in}^{2}}$

当 $\Delta V_{in}=0$ 时，$G_{m}$ 最大。此时 $V_{out1}-V_{out2}=R_{D}\Delta I=R_{D}G_{m}\Delta V_{in}$

故 $|A_{v}|=\sqrt{\mu_{n}C_{ox}\frac{W}{L}I_{SS}}R_{D}$

![[Pasted image 20260623201831.png]]

如图，当 $\Delta V_{in}>\Delta V_{in1}$ 时，$G_{m}$ 降低为 0。

#### 小信号分析

**叠加法**

![[Pasted image 20260623202901.png]]

此时，电路是带有负反馈调节的共源极。

从 M 2 的源极向下看，其电阻 $R_{S}'=\frac{1}{g_{m2}}$

所以： $\frac{V_{X}}{V_{in1}}=\frac{-R_{D}}{\frac{1}{g_{m1}}+\frac{1}{g_{m2}}}$

分析 $V_{Y}$:

![[Pasted image 20260623203759.png]]

得到其增益为：$\frac{V_{Y}}{V_{in1}}=\frac{R_{D}}{\frac{1}{g_{m2}}+\frac{1}{g_{m1}}}$

两式结合：

$(V_{X}-V_{Y})|_{Due\ to\ V_{in1}}=\frac{-2R_{D}}{\frac{1}{g_{m1}}+\frac{1}{g_{m2}}}V_{in1}$

若 $g_{m1}=g_{m2}=g_{m}$，则 $(V_{X}-V_{Y})|_{Due\ to\ V_{in1}}=-g_{m}R_{D}V_{in1}$

同理 $(V_{X}-V_{Y})|_{Due\ to\ V_{in2}}=-g_{m}R_{D}V_{in2}$

两式相加 $\frac{V_{X}-V_{Y}}{V_{in1}-V_{in2}}=-g_{m}R_{D}$

**辅助定理（半边电路法）**

![[Pasted image 20260624102839.png]]

此时电路对称，从 P 点打开，作为虚地。

$V_{in}=2V_{in1},V_{out1}=-g_{m}R_{out}(\frac{V_{in}}{2}),V_{out2}=-g_{m}R_{out}\frac{-V_{in}}{2}$

故 $A_{v}=\frac{V_{out1}-V_{out2}}{\frac{v_{in}}{2}-(-\frac{V_{in}}{2})}=-g_{m}R_{out}=-g_{m}(R_{D}||r_{o})$

**共模响应**

将 $R_{SS}$ 看作两个阻值为 $2R_{SS}$ 的电阻并联，有 $A_{V,CM}=\frac{g_{m}R_{D}}{1+2g_{m}R_{SS}}$

## 共模抑制比

$CMRR=|\frac{A_{DM-DM}}{A_{CM-DM}}|$

其中 $A_{DM-DM}$ 是差模增益

$A_{CM-DM}$ 是共模到差模的增益

共模到差模的增益意为输入共模时输出的差模增益。

理想差动放大器 $A_{CM-DM}=0$，CMRR=无穷大。

**负载电阻不对称**

$\Delta V_{X}=-\Delta V_{in,CM}\frac{g_{m}}{1+2g_{m}R_{SS}}R_{D}$

$\Delta V_{Y}=-\Delta V_{in,CM}\frac{g_{m}}{1+2g_{m}R_{SS}}(R_{D}+\Delta R_{D})$

所以 $A_{CM-DM}=-\frac{g_{m}}{1+2g_{m}R_{SS}}\Delta R_{D}$

有寄生电容，高频时 $R_{SS}$ 的阻抗更小，共模抑制比更小。

**晶体管失配的不对称**

$A_{CM-DM}=-\frac{g_{m1}-g_{m2}}{1+(g_{m1}+g_{m2})R_{SS}}R_{D}$

$CMRR\approx \frac{g_{m}}{\Delta g_{m}}(1+2g_{m}R_{SS})$
>看 ppt 上的内容

MOS 管作负载的差动对（看看 ppt）


