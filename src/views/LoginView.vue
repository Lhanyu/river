<template>
  <div class="login-root">
    <el-card class="login-card">
      <h2 style="text-align:center;">{{ isRegister ? '用户注册' : '用户登录' }}</h2>
      <el-form :model="form" @submit.prevent="onSubmit" label-position="right" label-width="80px">
        <el-form-item label="用户名">
          <el-input v-model="form.username" autocomplete="username" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="form.password" type="password" autocomplete="current-password" />
        </el-form-item>
        <el-form-item v-if="!isRegister">
          <el-checkbox v-model="form.remember">记住我（7天免登录）</el-checkbox>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="onSubmit" style="width:100%">{{ isRegister ? '注册' : '登录' }}</el-button>
        </el-form-item>
        <el-form-item>
          <el-link type="primary" @click="isRegister = !isRegister">
            {{ isRegister ? '已有账号？去登录' : '没有账号？去注册' }}
          </el-link>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import { useRouter } from 'vue-router';
const router = useRouter();
const isRegister = ref(false);
const form = ref({ username: '', password: '', remember: false });

const onSubmit = async () => {
  if (!form.value.username || !form.value.password) {
    ElMessage.error('请输入用户名和密码');
    return;
  }
  const url = isRegister.value ? '/api/register' : '/api/login';
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: form.value.username,
        password: form.value.password,
        remember: form.value.remember
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || '操作失败');
    if (isRegister.value) {
      ElMessage.success('注册成功，请登录');
      isRegister.value = false;
    } else {
      localStorage.setItem('token', data.token);
      localStorage.setItem('token_exp', Date.now() + (form.value.remember ? 7*24*60*60*1000 : 2*60*60*1000));
      ElMessage.success('登录成功');
      router.replace('/');
    }
  } catch (e) {
    ElMessage.error(e.message);
  }
};
</script>

<style scoped>
.login-root {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
}
.login-card {
  width: 350px;
  padding: 32px 24px 16px 24px;
  border-radius: 12px;
}
</style> 