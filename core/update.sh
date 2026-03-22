#!/bin/bash
newVersion=`wget -q -O - https://raw.githubusercontent.com/cdle/binary/main/compile_time.go | tr -cd "[0-9]"`
oldVersion=`cat /root/amd64/compile_time.go | tr -cd "[0-9]"`
if [[ ${#newVersion} == 13 && $newVersion != $oldVersion ]]; then
    rm -rf /root/binary
    cd /root
    git clone git@github.com:cdle/binary.git

    cd /root/amd64
    git checkout --orphan latest_branch
    rm -rf *
    cp /root/binary/sillyplus_linux_amd64_$newVersion /root/amd64
    cp /root/binary/compile_time.go /root/amd64
    git add -A
    git commit -am "commit message"
    git branch -D main
    git branch -m main
    git push -f origin main

    cd /root/arm64
    git checkout --orphan latest_branch
    rm -rf *
    cp /root/binary/sillyplus_linux_arm64_$newVersion /root/arm64
    cp /root/binary/compile_time.go /root/arm64
    git add -A
    git commit -am "commit message"
    git branch -D main
    git branch -m main
    git push -f origin main

    rm -rf /root/binary
fi

