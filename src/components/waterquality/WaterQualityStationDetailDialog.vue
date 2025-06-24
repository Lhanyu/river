<template>
  <el-dialog :model-value="visible" title="水质站详情" width="600px" @close="onClose" @update:model-value="onDialogUpdate">
    <el-descriptions v-if="detail" :title="detail.station_name" :column="2" border>
      <el-descriptions-item label="测站编码">{{ detail.station_code }}</el-descriptions-item>
      <el-descriptions-item label="断面名称">{{ detail.section_name }}</el-descriptions-item>
      <el-descriptions-item label="流域">{{ detail.basin_name }}</el-descriptions-item>
      <el-descriptions-item label="水系">{{ detail.river_system_name }}</el-descriptions-item>
      <el-descriptions-item label="河流">{{ detail.river_name }}</el-descriptions-item>
      <el-descriptions-item label="经度">{{ detail.longitude }}</el-descriptions-item>
      <el-descriptions-item label="纬度">{{ detail.latitude }}</el-descriptions-item>
      <el-descriptions-item label="一级水功能区">{{ detail.func_area1 }}</el-descriptions-item>
      <el-descriptions-item label="二级水功能区">{{ detail.func_area2 }}</el-descriptions-item>
      <el-descriptions-item label="管理单位">{{ detail.management_unit }}</el-descriptions-item>
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
import WaterQualityStationEditDialog from './WaterQualityStationEditDialog.vue';

const props = defineProps({ stationId: Number, visible: Boolean });
const emit = defineEmits(['update:visible', 'edit', 'deleted']);
const detail = ref(null);
const editDialogVisible = ref(false);

watch(() => props.stationId, async (id) => {
  if (id) {
    try {
      const res = await fetch(`/api/water_quality_stations/${id}`);
      detail.value = await res.json();
    } catch {
      ElMessage.error('获取水质站详情失败');
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
      `确定要删除水质站"${detail.value?.station_name}"吗？此操作不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );
    
    const response = await fetch(`/api/water_quality_stations/${detail.value.station_code}`, {
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