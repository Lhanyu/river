<template>
  <el-dialog :model-value="visible" title="雨量站详情" width="900px" @close="onClose" @update:model-value="onDialogUpdate">
    <el-descriptions v-if="detail" :title="detail.station_name" :column="2" border>
      <el-descriptions-item label="测站编码">{{ detail.station_code }}</el-descriptions-item>
      <el-descriptions-item label="流域">{{ detail.basin_name }}</el-descriptions-item>
      <el-descriptions-item label="经度">{{ detail.longitude }}</el-descriptions-item>
      <el-descriptions-item label="纬度">{{ detail.latitude }}</el-descriptions-item>
      <el-descriptions-item label="管理单位">{{ detail.management_unit }}</el-descriptions-item>
      <el-descriptions-item label="器口高度(m)">{{ detail.orifice_height }}</el-descriptions-item>
      <el-descriptions-item label="多年平均降雨量(mm)">{{ detail.avg_rainfall }}</el-descriptions-item>
      <el-descriptions-item label="实测年最大降雨量(mm)">{{ detail.max_rainfall }}</el-descriptions-item>
      <el-descriptions-item label="出现年份">{{ detail.max_rainfall_year }}</el-descriptions-item>
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
    <RainfallStationEditDialog
      v-if="editDialogVisible"
      :visible="editDialogVisible"
      :stationData="detail"
      v-model:visible="editDialogVisible"
      @saved="onEditSaved"
    />
  </el-dialog>
</template>
<script setup>
import { ref, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import RainfallStationEditDialog from './RainfallStationEditDialog.vue';
const props = defineProps({ stationId: Number, visible: Boolean });
const emit = defineEmits(['update:visible', 'edit', 'deleted']);
const detail = ref(null);
const editDialogVisible = ref(false);
watch(() => props.stationId, async (id) => {
  if (id) {
    try {
      const res = await fetch(`/api/rainfall_stations/${id}`);
      detail.value = await res.json();
    } catch {
      ElMessage.error('获取雨量站详情失败');
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
};
const onDelete = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要删除雨量站"${detail.value?.station_name}"吗？此操作不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );
    
    const response = await fetch(`/api/rainfall_stations/${detail.value.station_code}`, {
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