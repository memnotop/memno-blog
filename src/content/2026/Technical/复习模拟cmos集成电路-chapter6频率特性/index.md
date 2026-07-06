---
title: "复习：模拟cmos集成电路-chapter6频率特性"
description: "一句话摘要"
publishDate: "2026-06-26 21:33:17"
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

## 密勒效应
条件：阻抗与信号主通路并联

![[Pasted image 20260627120409.png]]

其中 $Z=\frac{1}{C_{F}S}$，$Z_{1}= \frac{Z}{1-\frac{V_{Y}}{V_{X}}}$，$Z_{2}=\frac{Z}{1-\frac{V_{X}}{V_{Y}}}$

$C_{1}=(1+A)C_{F}，C_{2}=(1+\frac{1}{A})C_{F}$

## 极点和节点

![[Pasted image 20260627120848.png]]

$\frac{V_{out}}{V_{in}}(s)=\frac{A_{1}}{1+R_{in}C_{in}s}\frac{A_{2}}{1+R_{1}C_{N}s}\frac{1}{1+R_{2}C_{P}s}=\frac{A_{1}}{1+\frac{s}{\frac{1}{R_{in}C_{in}}}}\frac{A_{2}}{1+\frac{s}{\frac{1}{R_{1}C_{N}}}}\frac{1}{1+\frac{s}{\frac{1}{R_{2}C_{P}}}}=\frac{A_{1}}{1+\frac{s}{\omega_{1}}}\frac{A_{2}}{1+\frac{s}{\omega_{2}}}\frac{1}{1+\frac{s}{\omega_{3}}}$

极点 $\omega_{1}=\frac{1}{R_{in}C_{in}}$，$\omega_{2}=\frac{1}{R_{1}C_{N}}$，$\omega_{3}=\frac{1}{R_{2}C_{P}}$

## 零极点特性

![[Pasted image 20260627121700.png]]

图形绘制题目要注意。

## 电容总结
![[Pasted image 20260627211134.png]]
## 频率分析

### 共源极

![[Pasted image 20260627210849.png]]

两个节点，分别是 in 和 out，中间一个放大器为共源极

$w_{in}=\frac{1}{R_{S}[C_{GS}+(1+g_{m}R_{D})C_{GD}]}$

$w_{out}=\frac{1}{R_{D}[C_{DB}+\frac{1}{1+g_{m}R_{D}}C_{GD}]}$


