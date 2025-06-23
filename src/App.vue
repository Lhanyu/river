<template>
  <div id="app">
    <el-container>
      <el-header class="header">
        <h1>中国流域水系测站管理系统</h1>
      </el-header>
      <el-main class="main-content">
        <div class="feature-buttons">
          <el-button :type="$route.path.startsWith('/stations') ? 'primary' : 'default'" @click="$router.push('/stations')">测站列表</el-button>
          <el-button :type="$route.path.startsWith('/cascade') ? 'primary' : 'default'" @click="$router.push('/cascade')">流域水系测站级联查询</el-button>
          <el-button :type="$route.path.startsWith('/visualization') ? 'primary' : 'default'" @click="$router.push('/visualization')">测站位置可视化</el-button>
          <el-button :type="$route.path.startsWith('/add-record') ? 'primary' : 'default'" @click="$router.push('/add-record')">添加记录</el-button>
        </div>
        <router-view />
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
// 无需再引入 StationList/BasinSystemStation
</script>

<style scoped>
#app {
  height: 100vh;
  width: 100vw;
  background-color: #f4f6f9;
}
.el-container, .el-header, .el-main {
  width: 100vw !important;
  max-width: 100vw !important;
  margin-left: 0 !important;
  margin-right: 0 !important;
  padding-left: 0 !important;
  padding-right: 0 !important;
  box-sizing: border-box;
}
.header {
  background-color: #337ecc;
  color: white;
  text-align: center;
  line-height: 60px;
}
.main-content {
  padding: 20px 0 20px 40px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.feature-buttons {
  margin-bottom: 24px;
  display: flex;
  gap: 16px;
  margin: 0 40px;
}
</style>
