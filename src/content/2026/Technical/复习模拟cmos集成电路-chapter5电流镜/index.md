---
title: "复习：模拟cmos集成电路-chapter5电流镜"
description: "一句话摘要"
publishDate: "2026-06-24 20:18:59"
tags:
  - technical
repositories:
  - technical
heroImageSrc: 
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

因此有 $\frac{I_{D2}}{I_{D1}}=\frac{(W/L)_{2}}{(W/L)_{1}}\frac{1+\lambda V_{DS2}}{1+\lambda V_{DS2}}$

虽然有 $V_{DS1}=V_{GS1}=V_{GS2}$，但是由于 $M_{2}$ 输出端负载的影响，$V_{DS2}$ 却不可能等于 $V_{GS2}$

为了解决这个问题，有两种方式

### 方法一：迫使 $V_{DS2}=V_{DS1}$

我们希望 $V_{DS2}$ 恒定，而且等于 $V_{DS1}$


