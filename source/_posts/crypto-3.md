---
title: "[CRYPTO] 암호학 공부 3일차"
date: 2026-03-23 14:50:00
categories: Essay
tags: [study]
---

# 암호학 공부 3일차
어느덧 3일차다.  
일수는 당연히 공부한 날만 포함시키고 있다.  
오늘은 따로 공부한 것 없이 배경지식으로 풀었다.  
<!--more-->

# Base64 10 Times
문제 파일에는 코드 없다고 적혀 있고, 문제 설명에 `base64`가 10번 된 암호문이 있다.  

```py
import base64

with open("./enc.txt") as f:
    enc = f.read()

for i in range(11):
    enc = base64.b64decode(enc)

print(enc)
```
이렇게 해주면 끝 ㅋ
개인적으로 요즘 알고리즘 문제를 풀지 않아서  
나름대로 코드를 짜보기로 했다.  

---
# ByteCaesar  
레전드 카이사르 암호화.  

주어진 문제 파일 중 `secret`:
```txt
This is not real flag, DH{FAKE_FLAG} :>
```

그리고 `prob.py`
```py
import random

class Caesar:
    def __init__(self, key):
        assert isinstance(key, int) and 1 <= key <= 255
        self._key = key

    def encrypt(self, msg):
        msg_enc = b""
        for b in msg:
            msg_enc = msg_enc + bytes([(b + self._key) % 256])
        return msg_enc

    def decrypt(self, msg):
        msg_dec = b""
        for b in msg:
            msg_dec = msg_dec + bytes([(b - self._key) % 256])
        return msg_dec

def main():
    key = random.randint(1, 255)
    with open("secret", "rb") as f:
        secret = f.read()

    cipher = Caesar(key)
    secret_enc = cipher.encrypt(secret)
    print("I believe Caesar cipher is greatest encryption of all time.")
    print("No one can leak my secret sentence!")
    print(f"my encrypted sentence > {secret_enc.hex()}")

if __name__ == "__main__":
    main()
```

복호화 코드도 친절히 내장되어있다.  
가져다 써야지~~

`bytes.fromhex()` 를 써서 bytes로 바꾼 뒤  
`decode`를 이용해 `1~255`까지 돌려보면서 복문에 `DH{`가 포함된 경우 출력한다.  

---
암호학, 나 좀 재능 있을지도.  
포너블 쪽도 올려야한다.