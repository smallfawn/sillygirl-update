import{a as c}from"./element-plus-Bs4xNYeT.js";import{k as _,H as i,L as m,M as o,O as a,e as v,ag as l,P as s,Y as f}from"./vue-vendor-DK0ukTh7.js";const x={class:"script-page"},V={class:"card-header"},C={__name:"Index",setup(k){const t=v(""),n=()=>{c.success("保存成功")};return _(()=>{t.value=`/**
 * @title 示例脚本
 * @rule 你好
 */

s.reply("Hello World!");
`}),(y,e)=>{const r=l("el-button"),d=l("el-input"),p=l("el-card");return i(),m("div",x,[o(p,null,{header:a(()=>[s("div",V,[e[2]||(e[2]=s("span",null,"脚本编辑",-1)),o(r,{type:"primary",onClick:n},{default:a(()=>[...e[1]||(e[1]=[f("保存",-1)])]),_:1})])]),default:a(()=>[o(d,{modelValue:t.value,"onUpdate:modelValue":e[0]||(e[0]=u=>t.value=u),type:"textarea",rows:25,placeholder:"输入JavaScript代码..."},null,8,["modelValue"])]),_:1})])}}};export{C as default};
