---
title: "[V8] V8 공부 - 빌드"
date: 2026-01-27 21:25:11
categories: Essay
tags: [V8]
---

# V8 빌드

bash 스크립트:  
```bash
#!/bin/bash

# 1. git clone
git clone https://chromium.googlesource.com/chromium/tools/depot_tools.git

# 2. 빌드 준비
export PATH=`pwd`/depot_tools:"$PATH"
fetch v8
cd v8
./build/install-build-deps.sh
sudo apt-get install ninja-build

# optional: 특정 버전으로 빌드하고 싶은 경우 commit version을 넣습니다
git checkout 6538a20aa097f9c05ead98eb88c71819aa1e65aa

gclient sync

# optional: ctf등에서 patch파일이 주어지는 경우, 해당 파일로 patch해줍니다
# git apply <patchfile>

# 3.a. v8gen.py를 이용한 빌드
./tools/dev/v8gen.py x64.release
ninja -C ./out.gn/x64.release

./tools/dev/v8gen.py x64.debug
ninja -C ./out.gn/x64.debug

# 3.b. gm.py를 이용한 빌드
tools/dev/gm.py x64.release
tools/dev/gm.py x64.debug
```

### d8 실행
```bash
user@hostname:~/v8$ cd out/
user@hostname:~/v8/out$ ls
x64.debug  x64.release
```

```bash
user@hostname:~/v8/out/x64.release$ ./d8 
V8 version 11.2.214.14
d8> a = 1
1
d8> console.log(1);
1
undefined
d8> 
```

... 그냥 빌드하는 부분이다. 깃허브에서 이것저것 쓸 경우마다 거의 비슷한 상황을 겪어 상당히 실행도중 불안한 느낌을 받았다..

---
# REFERENCES
- [dreamhack V8 Lecture - Build](https://learn.dreamhack.io/443)