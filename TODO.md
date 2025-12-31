## 10人初步名单

10人名单后

场下替补

一天最多换四个

换下场不能上场

## 比赛结束后的预测率

1. 十六人预测
   与
2. 替补预测

scp kirari@192.168.202.129:/home/kirari/Projects/ekiden_predict/.next.zip E:\

scp kirari@192.168.202.129:/home/kirari/Projects/ekiden_predict/next-build-*.tar.gz  E:/

打包流程

本地linux

tar -czf next-build-$(date +%s).tar.gz .next

本地：

scp kirari@192.168.202.129:/home/kirari/Projects/ekiden_predict/next-build-*.tar.gz  E:/


scp kirari@192.168.202.129:/home/kirari/Projects/ekiden_predict/node_moudules.zip  E:/

上传后：

rm -rf .next
tar -xzf next-*.tar.gz

出现连接池错误时

systemctl restart mysql
