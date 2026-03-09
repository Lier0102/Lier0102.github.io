---
title: "[DREAMHACK] simple-crack-me-2 writeup"
date: 2026-03-09 16:29:00
categories: Essay
tags: [writeup]
---

근데 리버싱은 어떤 식으로 작성해야 되지.  

# 동적 분석
... 이번에는 실행부터 시켜봤다.  
```bash
root@ac535343ff57 ~/pwn
❯ ./simple_crack_me_2
sasdf
your input length is wrong x(
```

이 외에도 다양한 입력을... 물론 `fuzzer`는 쓰지 않았지만 수동 퍼저가 되어보았다.  

바로 막혀서 `# 정적분석`으로 넘어가겠다.
<!--more-->

# 정적 분석

**기드라**로 열어보면 이렇다. 
```c
int main(void)

{
  long lVar1;
  int iVar2;
  size_t len;
  long in_FS_OFFSET;
  char input [264];
  
  lVar1 = *(long *)(in_FS_OFFSET + 0x28);
  __isoc99_scanf("%63s",input);
  len = strlen(input);
  if (len == 0x20) {
    XORwithParam2(input,&DAT_00402068);
    incWithParam2(input,'\x1f');
    decWithParam2(input,'Z');
    XORwithParam2(input,&DAT_0040206d);
    decWithParam2(input,'M');
    incWithParam2(input,-0xd);
    XORwithParam2(input,&DAT_00402072);
    iVar2 = memcmp(input,PTR_DAT_00404050,0x20);
    if (iVar2 == 0) {
      puts("Correct!");
      iVar2 = 0;
    }
    else {
      puts("your input is wrong x(");
      iVar2 = 1;
    }
  }
  else {
    puts("your input length is wrong x(");
    iVar2 = 1;
  }
  if (lVar1 != *(long *)(in_FS_OFFSET + 0x28)) {
                    /* WARNING: Subroutine does not return */
    __stack_chk_fail();
  }
  return iVar2;
}
```
`리네임` 및 `리타입`이 모두 끝난 상황이다.  
드림핵 강의를 보며 따라했는데 버전이 더 높아서 그런가 불필요한 작업이 줄어드는 경우도 있었다.  

아무튼, 숨겨진 값은 아래와 같은 과정으로 만들어진다:  

1. 길이가 `0x20`
2. `DAT_00402068`과(와)의 `XOR` 연산
3. `0x1f`과(와)의 증가 연산
4. `'Z'(아스키코드값)`과(와)의  감소 연산
5. `DAT_0040206d`과(와)의 `XOR` 연산
6. ...

절대 적기 귀찮아서 적지 않은 것이 아니다.  
독자들의 시력건강을 위해 5번 까지만 적었다.  

아무튼 이 연산을 거친 값이 우리가 입력했던 값 `input` 변수에 저장이 될 것이다.  
그런데 이것이 사전에 저장된 `PTR_DAT_00404050`과 비교한다.  

`PTR_DAT` 가져다가 역연산 하면 바로 풀리는 거긴 함.  

`A xor B 가 C일 때`  
`C에 xor A`를 하면 B를 구할 수 있다.  

그리고 덧셈 연산을 뺄셈으로 역, 뺄셈 연산을 덧셈 연산으로 역..  
하면 끝이다.  

기능을 `c언어`로 구현하고 풀어보겠다.  

```c
#include <stdio.h>
#include <string.h>

void Xor(char *input, char *p) {
    size_t a;
    int i;

    a = strlen(p);

    for (i = 0; i < 0x20; i++) {
        input[i] = p[(unsigned long)(long)i % a] ^ input[i];
    }
    return;
}

void Inc(char *input, char p) {
    int i;

    for (i = 0; i < 0x20; i++) {
        input[i] = p + input[i];
    }

    return;
}

void Dec(char *input, char p) {
    int i;

    for (i = 0; i < 0x20; i++) {
        input[i] = input[i] - p;
    }

    return;
}

void decode(char *cipher) {
    Xor(cipher, "\x11\x33\x55\x77\x99\xbb\xdd");
    Dec(cipher, -13); // 0xd == 13
    Inc(cipher, 77); // M, 0x4d == 64 + 13 == 77
    Xor(cipher, "\xef\xbe\xad\xde"); // 0xdeadbeef
    Inc(cipher, 90); // 0x5a = 80 + 10 = 90
    Dec(cipher, 31); // 0x1f = 16 + 15
    Xor(cipher, "\xde\xad\xbe\xef");

    return;
}

int main() {
    char data[] = "\xf8\xe0\xe6\x9e\x7f\x32\x68\x31\x05\xdc\xa1\xaa\xaa\x09\xb3\xd8\x41\xf0\x36\x8c\xce\xc7\xac\x66\x91\x4c\x32\xff\x05\xe0\xd9\x91\x00";

    decode(data);
    printf("REAL FLAG: %s", data);

    return 0;
}
```

암호문은 **기드라**에서 `python byte string`으로 복사해서 쓰면 된다.  
나머지 값 들도 순서에 맞게 가져오면 된다.  

--- 

리버싱은 포너블 하다보니 못하면 이상한 학문이랄까.. 딱히  
어려움은 못 느꼈다