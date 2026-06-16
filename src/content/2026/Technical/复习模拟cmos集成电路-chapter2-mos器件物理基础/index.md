---
title: 复习：模拟cmos集成电路-chapter2-mos器件物理基础
description: 第二章复习
publishDate: 2026-06-16 08:51:00
tags:
  - technical
  - 模拟cmos
  - 复习
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
1. 能分清大信号和小信号、以及在电路中的表示方法
2. 能画出完整的MOS的小信号电路图，说明衬底偏置效应、沟道长度调制效应的影响及改善方法，说明寄生电容的组成。

## 区分大信号和小信号
1. 符号表示
   $V_{in}=V_B+v_{in}$ 
   其中，全大写表示大信号，全小写表示小信号。
2. 图像表示

![[Pasted image 20260616090943.png]] 


## gm 推导
$I_{d}=\frac{\mu_{n}C_{ox}}{2}\frac{W}{L}(V_{in}-V_{TH})^2=\frac{\mu_{n}C_{ox}}{2}\frac{W}{L}[(V_{B}-V_{TH})+v_{a}sin(\omega t)]^2$ 

$=I_{D}+[\mu_{n}C_{ox}\frac{W}{L}(V_{B}-V_{TH})]\cdot v_{a}sin(\omega t)$ +一坨东西（可以忽略）

其中，$i_{d}=[\mu_{n}C_{ox}\frac{W}{L}(V_{B}-V_{TH})]\cdot v_{a}sin(\omega t)$ 

$v_{out}=-i_{d}R_{D}=-[\mu_{n}C_{ox}\frac{W}{L}(V_{B}-V_{TH})]\cdot v_{a} sin(\omega t)$

可以知道，$gm = [\mu_{n}C_{ox}\frac{W}{L}(V_{B}-V_{TH})]$

## 小信号电路图 

![[Pasted image 20260616093312.png]]

## gm 的形式变换
$g_{m}=\mu_{n}C_{ox} \frac{W}{L}(V_{GS}-V_{TH})$

$=\sqrt{2\mu_{n}C_{ox}\frac{W}{L}I_{D}}$

$=\frac{2I_{D}}{V_{GS}-V_{TH}}$

![[Pasted image 20260616093735.png]]


## 二级效应
### 体效益

体端加压会导致耗尽层变宽，从而要更大的电压才可反型。

考虑体效应后，反型电压：

$V_{TH}=V_{TH0}+\gamma(\sqrt{|2\Phi_{F}+V_{SB}|}-\sqrt{|2\Phi_{F}|})$

### 沟道长度调制

跨导受沟道长度影响，修正后为:

$g_{m}=\sqrt{2\mu_{n}C_{ox}(\frac{W}{L})I_{D}(1+\lambda V_{DS})}$

其中，$\lambda$ 与沟道长度相关

$\lambda=\frac{1}{L}(\frac{\Delta L}{V_{DS}})\varpropto \frac{1}{L}$

源头公式：

I_D ≈ 1/2 μn Cox W/L (V_GS - V_TH)^2 (1 + λV_DS)

### 压阈值到点性

后期补充

## 二级效应在小信号模型中的体现

![[Pasted image 20260616160443.png]]

其中，$g_{mb}$ 是体效应的体现，$r_{o}$ 是沟道长度调制

## 电容分析

![[Pasted image 20260616161030.png]]

![[Pasted image 20260616161100.png]]

**栅源和栅漏电容随的 $V_{GS}$ 变化曲线**

![[Pasted image 20260616161517.png]]

为什么随着 $V_{GS}$ 增加电容会有变化？

因为形成了沟道，增加的是沟道电容。

前期沟道夹断，只有源极有沟道电容，后期漏极有。