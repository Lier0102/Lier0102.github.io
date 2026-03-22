---
title: "[CRYPTO] 암호학 공부 2일차"
date: 2026-03-22 24:00:00
categories: Essay
tags: [study]
---

# 암호학 공부 2일차
공부한다 해놓고 며칠간 또 제대로 하지 못했다.  
ctf도 망치고, 많이 아쉽다.  

피지컬, 기본기가 갖춰지지 않다고 느꼈다.  
특히 암호학에서 그런 느낌을 많이 받아 평타는 치려고 한다.  
그런 의미로 오늘 푼 문제는 `likeb64`다.  
<!--more-->

> 드림이가 base64를 공부하고 자신만의 암호를 만들었어요.
> 다음 주어진 암호문에서 플래그를 구해보세요!  
> 
> IREHWYJZMEcGCODGMMbTENDDGcbGEMJZGEbGEZTFGYaGKNRTMIcGIMBSGRQTSNDDGAaWGYZRHEbGCNRQMUaDOMbEMRTGEYJYGUaWGOJQMYZHa===  
>
> 플래그 형식은 DH{...} 입니다.  
> hint: ABCDEFGHIJKLMNOPQRSTUVWXYZabcdef  

이런 느낌이다.  
솔직히 이번 문제는 내 힘으로 풀지 못했다.  
가장 먼저 저 문자열들이 나열된 이유를 정확히 파악하지 못했기 때문이다.  

위 암호문에서 `base64`가 아닌가, 싶었지만 cyberchef에서 막혔다.  
그리고 인터넷을 쓰지 않고 코드로 풀어보자는 쪽, 내장 함수를 사용하는 쪽으로 가기로 했다.  

그러나 여전히 이런 문제를 풀어보지 않았기에 막혔다.  

알고 있는 단서는  
- 1. base64
- 2. 암호화할 때 쓰는 테이블 같은 거..???  

그런데 결론적으론  
**base64**가 아니다.  

`base32`다. 정확히는 약간 수정된 `base32`???  

원래 `base32`는 아래 문자들을 사용한다.  

`ABCDEFGHIJKLMNOPQRSTUVWXYZ234567`  
즉 여기서 `2-7`이 **`a-f`** 로 바뀐 것 뿐이다.  

따라서 `base32`의 복호화 방식을 따르되,  
참고하는 테이블 같은 녀석은 `2-7`을 `a-f`로 치환해서 생각하는 걸로  
진행하면 될 것 같다.  

라는 게 위대하신 `LLM`님의 의견..  

작성한 코드는 아래와 같다:
```py
import base64

def solve():
    encoded_str = "IREHWYJZMEcGCODGMMbTENDDGcbGEMJZGEbGEZTFGYaGKNRTMIcGIMBSGRQTSNDDGAaWGYZRHEbGCNRQMUaDOMbEMRTGEYJYGUaWGOJQMYZHa==="

    custom_alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdef"

    standard_alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"

    trans_table = str.maketrans(custom_alphabet, standard_alphabet)

    translated_str = encoded_str.translate(trans_table)

    decoded_bytes = base64.b32decode(translated_str)
    print(f"Flag: {decoded_bytes.decode('utf-8')}")

if __name__ == "__main__":
    solve()

```

지능 이슈로 암호학은 이론적으로 접근하는 게 어려울 것 같다.  
`1~2`렙은 기출 느낌으로 빨리 익히고  
`3~5`렙까지 적당히 공부해서 풀 수 있을 정도로 만들 예정이다.  
주로 암호학에 집중해서 4월까지 해볼 예정이다.