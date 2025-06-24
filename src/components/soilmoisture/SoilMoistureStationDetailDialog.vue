<template>
  <el-dialog :model-value="visible" title="墒情站详情" width="600px" @close="onClose" @update:model-value="onDialogUpdate">
    <el-descriptions v-if="detail" :title="detail.station_name" :column="2" border>
      <el-descriptions-item label="测站编码">{{ detail.station_code }}</el-descriptions-item>
      <el-descriptions-item label="流域">{{ detail.basin_name }}</el-descriptions-item>
      <el-descriptions-item label="经度">{{ detail.longitude }}</el-descriptions-item>
      <el-descriptions-item label="纬度">{{ detail.latitude }}</el-descriptions-item>
      <el-descriptions-item label="管理单位">{{ detail.management_unit }}</el-descriptions-item>
      <el-descriptions-item label="设站年份">{{ detail.setup_year }}</el-descriptions-item>
      <el-descriptions-item label="设站月份">{{ detail.setup_month }}</el-descriptions-item>
      <el-descriptions-item label="省">{{ detail.province }}</el-descriptions-item>
      <el-descriptions-item label="市">{{ detail.city }}</el-descriptions-item>
      <el-descriptions-item label="县">{{ detail.county }}</el-descriptions-item>
      <el-descriptions-item label="乡镇">{{ detail.town }}</el-descriptions-item>
      <el-descriptions-item label="村街道">{{ detail.village }}</el-descriptions-item>
      <el-descriptions-item label="备注">{{ detail.remark }}</el-descriptions-item>
    </el-descriptions>
    <div v-else>加载中...</div>
    <template #footer>
      <div style="text-align: right;">
        <el-button @click="onClose">关闭</el-button>
        <el-button type="danger" @click="onDelete">删除</el-button>
        <el-button type="primary" @click="onEdit">修改</el-button>
      </div>
    </template>
  </el-dialog>
</template>
<script setup>
import { ref, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import SoilMoistureStationEditDialog from './SoilMoistureStationEditDialog.vue';

const props = defineProps({ stationId: Number, visible: Boolean });
const emit = defineEmits(['update:visible', 'edit', 'deleted']);
const detail = ref(null);
const editDialogVisible = ref(false);

watch(() => props.stationId, async (id) => {
  if (id) {
    try {
      const res = await fetch(`/api/soil_moisture_stations/${id}`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();
      detail.value = data;
    } catch (error) {
      console.error('墒情站详情对话框: 获取数据失败:', error);
      ElMessage.error('获取墒情站详情失败: ' + error.message);
    }
  }
}, { immediate: true });

const onClose = () => emit('update:visible', false);
const onDialogUpdate = (val) => emit('update:visible', val);

const onEdit = () => {
  emit('edit', detail.value);
  onClose();
};

const onEditSaved = () => {
  editDialogVisible.value = false;
  // 可选：刷新详情数据
};

const onDelete = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要删除墒情站"${detail.value?.station_name}"吗？此操作不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );
    
    const response = await fetch(`/api/soil_moisture_stations/${detail.value.station_code}`, {
      method: 'DELETE',
    });
    
    if (response.ok) {
      ElMessage.success('删除成功');
      emit('deleted');
      onClose();
      // 刷新页面
      window.location.reload();
    } else {
      const error = await response.json();
      ElMessage.error(error.message || '删除失败');
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败');
      console.error('删除失败:', error);
    }
  }
};
</script> 