---
title: "[CRYPTO] 암호학 공부 1일차"
date: 2026-03-10 22:00:00
categories: Essay
tags: [study]
---


> 문제 설명  
> This Problem Basic_Crpyto(Roman emperor's cipher)  
> FLAG FORMAT(A~Z) and empty is "_"  
> DH{decode_Text}
<!--more-->

바로 카이사르 쪽 떠올렸다.  
예전에 강의를 어디서 본 기억 덕분에..

![image.png](https://dreamhack-media.s3.amazonaws.com/attachments/06fc2d8c7520c3f20c1f61d540034e0067132908a3127076742d78d5ca90a1b1.png)

![image.png](https://dreamhack-media.s3.amazonaws.com/attachments/d033f4a3a6ffd466154d1ebbd05bbbd41fb4495b58536554076d471f2abda714.png)

1분컷..?  
오늘 배운 내용이 너무 빡셌다. `_Backups`에 올려두긴 했지만 이해하는데 내일을 또 써야할 것 같다. 일단 웹쪽 다시 하고 와야지  

이론을 접하려고 하니 너무 딱딱하고 어지러웠다.  
기능 때문에 심신미약인데, 이게 뭐냐.  

그렇기 때문에 쉬운 암호학 문제를 푸는 사내. 그것이 나다.  

이번 문제는  

# SingleByteXor
> 문제 설명
어느날, 살인사건이 일어났다.
살인 사건의 유일한 증거물은 쓰여있는 쪽지에는, 다음과 같이 적혀있었다.
54586b6458754f7b215c7c75424f21634f744275517d6d
크립이에게 주어진 단서는, 쪽지의 내용과 이것이 어떤 단일바이트와 XOR해서 만들어진 암호라는 단서 뿐.
과연 크립이는 범인을 찾을 수 있을 것인가..!

> flag 타입은 DH{message}입니다  

문제 설명을 보면 단일 바이트라는 증거를 얻을 수 있다.  
`1 바이트` 짜리 키를 구해 복호화하면 된다.  

암호문을 `0x0` ~ `0xff` 까지의 키를 돌려보면 됩니다.  

```py
#!/usr/bin/env python3

cipher = "54586b6458754f7b215c7c75424f21634f744275517d6d"
cipher = bytes.fromhex(cipher)

for key in range(0xFF):
    result = bytes([b ^ key for b in cipher])

    if all(0x20 <= c < 0x7F for c in result):
        print(f"Key 0x{key:02x} ({key:3d}): {result.decode()}")
```

그리고 각 비교를 위해 원문도 하나하나 출력하도록 한다.  
원래 예쁘게 출력하는 용도로 키를 출력한다.

```c
Key 0x00 (  0): TXkdXuO{!\|uBO!cOtBuQ}m
Key 0x01 (  1): UYjeYtNz ]}tCN bNuCtP|l
Key 0x05 (  5): Q]na]pJ~$YypGJ$fJqGpTxh
Key 0x06 (  6): R^mb^sI}'ZzsDI'eIrDsW{k
Key 0x07 (  7): S_lc_rH|&[{rEH&dHsErVzj
Key 0x08 (  8): \PclP}Gs)Tt}JG)kG|J}Yue
Key 0x09 (  9): ]QbmQ|Fr(Uu|KF(jF}K|Xtd
Key 0x0c ( 12): XTghTyCw-PpyNC-oCxNy]qa
Key 0x0d ( 13): YUfiUxBv,QqxOB,nByOx\p`
Key 0x0e ( 14): ZVejV{Au/Rr{LA/mAzL{_sc
Key 0x0f ( 15): [WdkWz@t.SszM@.l@{Mz^rb
Key 0x10 ( 16): DH{tHe_k1LleR_1s_dReAm}
Key 0x11 ( 17): EIzuId^j0MmdS^0r^eSd@l|
Key 0x13 ( 19): GKxwKf\h2OofQ\2p\gQfBn~
Key 0x15 ( 21): AM~qM`Zn4Ii`WZ4vZaW`Dhx
Key 0x16 ( 22): BN}rNcYm7JjcTY7uYbTcGk{
Key 0x17 ( 23): CO|sObXl6KkbUX6tXcUbFjz
Key 0x18 ( 24): L@s|@mWc9DdmZW9{WlZmIeu
Key 0x19 ( 25): MAr}AlVb8Eel[V8zVm[lHdt
Key 0x1a ( 26): NBq~BoUa;FfoXU;yUnXoKgw
Key 0x1d ( 29): IEvyEhRf<Aah_R<~Ri_hL`p
Key 0x1e ( 30): JFuzFkQe?Bbk\Q?}Qj\kOcs
Key 0x1f ( 31): KGt{GjPd>Ccj]P>|Pk]jNbr
```

`Key 0x10 ( 16): DH{tHe_k1LleR_1s_dReAm}`

암호학 이론보면 어렵다. 그게 되어야 3~4렙은 가는 거라 그런 걸까나..  
일단 쉬운 문제들부터 풀어봐야겠다.  

1렙들은 쉬운 경우 알고리즘만 머리로 짤 줄만 알아도 풀리는 경우가 다반사인 것 같으니까..?