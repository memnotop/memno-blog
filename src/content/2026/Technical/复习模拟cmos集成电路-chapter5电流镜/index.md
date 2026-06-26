---
title: "复习：模拟cmos集成电路-chapter5电流镜"
description: "一句话摘要"
publishDate: "2026-06-24 20:18:59"
tags:
  - technical
repositories:
  - technical
heroImageSrc: ../../../../../public/img/covers/cmos.webp
heroImageAlt: 封面图说明
heroImageColor: "#659EB9"
showHeroImage: true
language: "中文"
draft: false
---

<!-- 这里先写一句你想表达的核心观点。 -->

## 基本电流镜

![[Pasted image 20260624202351.png]]

作用在 $M_2$ 栅级的 $V_{G2}=V_{DS1}=V_{GS1}$ ，所以$V_{GS2}=V_{GS1}=f^{-1}(I_{REF})$

若 $g_{m1}=g_{m2}$，有 $I_{out}=f(f^{-1}(I_{REF}))=I_{REF}$，故能够完成精准的复制。

**具体来看**

$I_{REF}=\frac{1}{2}\mu_{n}C_{ox}(\frac{W}{L})_{1}(V_{GS}-V_{TH})^{2}$

$I_{out}=\frac{1}{2}\mu_{n}C_{ox}(\frac{W}{L})_{2}(V_{GS}-V_{TH})^{2}$

所以 $I_{out}=\frac{(W/L)_{2}}{(W/L)_{1}}I_{REF}$ (受长宽比的影响)

对此，我们可以有不同比例的变化

**图例**

![[Pasted image 20260624204110.png]]

吃透这两个图。

其中，串联增加 L，并联增加 W。

## 共源共栅电流镜
不忽略沟道长度调制

$I_{D}=\frac{1}{2}\mu_{n}C_{ox}(\frac{W}{L})_{1}(V_{GS}-V_{TH})^{2}(1+\lambda V_{DS})$

因此有 $\frac{I_{D2}}{I_{D1}}=\frac{(W/L)_{2}}{(W/L)_{1}}\frac{1+\lambda V_{DS2}}{1+\lambda V_{DS1}}$

虽然有 $V_{DS1}=V_{GS1}=V_{GS2}$，但是由于 $M_{2}$ 输出端负载的影响，$V_{DS2}$ 却不可能等于 $V_{GS2}$

为了解决这个问题，有两种方式

### 方法一：迫使 $V_{DS2}=V_{DS1}$

我们希望 $V_{DS2}$ 恒定，而且等于 $V_{DS1}$

在第三章中我们知道，共源共栅器件可以屏蔽电流源

![[Pasted image 20260625081643.png]]

在图（a）中，即使 $V_{P}$ 变化很大，$V_{Y}$ 仍保持相对不变。

要保证 $V_{DS2}=V_{DS1}$，我们必须使 $V_{b}-V_{GS3}=V_{DS1}(=V_{GS1})$，即 $V_{b}=V_{GS3}+V_{GS1}$ 

可以使 $V_{GS0}+V_{GS1}=V_{GS3}+V_{GS1}$，从而有 $V_{GS0}=V_{GS3}$

**总结**

这种方式提高了输出阻抗和更精确的电流传递值，但却消耗了很大的电压余量

P 点允许的最小电压为 $V_{N}-V_{TH}=V_{GS0}+V_{GS1}-V_{TH}=(V_{GS0}-V_{TH})+(V_{GS1}-V_{TH})+V_{TH}$

![[Pasted image 20260625091042.png]] 

（a）不精确但是最低电平更低，（b）更精确但是电压的余量小。

### 方法二：迫使 $V_{DS1}=V_{DS2}$

![[Pasted image 20260625151706.png]]

可以看出，若 $V_{GS0}=V_{GS3}$，则可以迫使 $V_{DS1}=V_{DS2}$

$M_{0}$ 在饱和区要求 $V_{b}-V_{TH0}\le V_{X}(=V_{GS1})$，所以 $V_{GS1}-V_{TH1}\le V_{A}(=V_{b}-V_{GS0})$

所以 $V_{GS0}+(V_{GS1}-V_{TH1})\le V_{b}\le V_{GS1}+V_{TH0}$

## 有源电流镜

### 无源负载差动对

![[Pasted image 20260625164001.png]]

$I_{out}$ 由 M 1 和 M 2 同时产生，各有一半的功劳。所以 $G_{m}=\frac{I_{out}}{V_{in}}=(g_{m1}V_{in}/2)/V_{in}=g_{m1}/2$

对于 $R_{out}$ 的计算，如图 C，$R_{deg}=\frac{1}{g_{m1}}||r_{O1}$ 所以，从上往下看是源极负反馈 $R=(1+g_{m2}r_{O2})R_{deg}+r_{O2}\approx 2r_{O2}$ 

从而 $R_{out}\approx (2r_{O2})||r_{O4}$

故 $|A_{v}|\approx \frac{g_{m1}}{2}[(2r_{O2})||r_{O4}]$

### 五管 OTA

![[Pasted image 20260626105339.png]]


当 $V_{in1}=V_{in2}$ 时，假设电路完全对称，则 $V_{out}=V_{F}=V_{DD}-|V_{GS3}|$

共模范围：$V_{out,DC}=V_{DD}-|V_{GS3}|$，$V_{OD5}+V_{GS1}\le V_{in,CM}\le V_{out,CM}+V_{TH2}=V_{F}+V_{TH2}=V_{DD}-|V_{GS3}|+V_{TH}$

$V_{in,CM}-V_{TH2}\le V_{out,CM}\le V_{DD}-|V_{OD4}|$

**差模分析**

由于电流镜的镜像电流作用

令 $V_{in1}=\frac{v_{in}}{2}$，$V_{in2}=\frac{-v_{in}}{2}$

$I_{out}=(g_{m1}\cdot(\frac{v_{in}}{2}))-g_{m1}\cdot \frac{-v_{in}}{2}$（电流镜将左边的电流变化带到了右边）

所以 $G_{m}=(I_{out})/V_{in}=g_{m1}$

$R_{out}\approx r_{o2}||r_{o4}$，故而 $A_{v}=G_{m}R_{out}=g_{m1}\cdot(r_{o2}||r_{o4})$

