更新流程


1. 上传github
2. 本地虚拟器拉取
3. 本地虚拟器测试通过后 `npm run build`
4. 本地虚拟器打包 `.next`
5. 主机PowerShell `scp 用户名@虚拟器ip:打包地址 输出地址`
6. 宝塔虚拟机 ` git pull`/宝塔上传输出到主机的  `.next.zip `进行解压 `npm start`

`git pull ---no-rebase`
