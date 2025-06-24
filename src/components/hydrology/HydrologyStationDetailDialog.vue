<template>
  <el-dialog :model-value="visible" title="水文站详情" width="900px" @close="onClose" @update:model-value="onDialogUpdate">
    <el-descriptions v-if="detail" :title="detail.station_name" :column="2" border>
      <el-descriptions-item label="测站编码">{{ detail.station_code }}</el-descriptions-item>
      <el-descriptions-item label="流域">{{ detail.basin_name }}</el-descriptions-item>
      <el-descriptions-item label="水系">{{ detail.river_system_name }}</el-descriptions-item>
      <el-descriptions-item label="经度">{{ detail.longitude }}</el-descriptions-item>
      <el-descriptions-item label="纬度">{{ detail.latitude }}</el-descriptions-item>
      <el-descriptions-item label="集水面积">{{ detail.catchment_area }}</el-descriptions-item>
      <el-descriptions-item label="设站年份">{{ detail.setup_year }}</el-descriptions-item>
      <el-descriptions-item label="设站月份">{{ detail.setup_month }}</el-descriptions-item>
      <el-descriptions-item label="省">{{ detail.province }}</el-descriptions-item>
      <el-descriptions-item label="市">{{ detail.city }}</el-descriptions-item>
      <el-descriptions-item label="县">{{ detail.county }}</el-descriptions-item>
      <el-descriptions-item label="乡镇">{{ detail.town }}</el-descriptions-item>
      <el-descriptions-item label="村街道">{{ detail.village }}</el-descriptions-item>
      <el-descriptions-item label="河流">{{ detail.river_name }}</el-descriptions-item>
      <el-descriptions-item label="测站高程">{{ detail.elevation }}</el-descriptions-item>
      <el-descriptions-item label="基面名称">{{ detail.datum_name }}</el-descriptions-item>
      <el-descriptions-item label="基面修正值">{{ detail.datum_correction }}</el-descriptions-item>
      <el-descriptions-item label="建设单位">{{ detail.construction_unit }}</el-descriptions-item>
      <el-descriptions-item label="管理单位">{{ detail.management_unit }}</el-descriptions-item>
      <el-descriptions-item label="所属勘测队">{{ detail.survey_team }}</el-descriptions-item>
      <el-descriptions-item label="备注">{{ detail.remark }}</el-descriptions-item>
      <el-descriptions-item label="全年平均径流量">{{ detail.annual_runoff }}</el-descriptions-item>
      <el-descriptions-item label="最大流量">{{ detail.max_flow }}</el-descriptions-item>
      <el-descriptions-item label="最大流量时间">{{ detail.max_flow_time }}</el-descriptions-item>
      <el-descriptions-item label="最小流量">{{ detail.min_flow }}</el-descriptions-item>
      <el-descriptions-item label="最小流量时间">{{ detail.min_flow_time }}</el-descriptions-item>
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
import HydrologyStationEditDialog from './HydrologyStationEditDialog.vue';

const props = defineProps({ stationId: Number, visible: Boolean });
const emit = defineEmits(['update:visible', 'edit', 'deleted']);
const detail = ref(null);
const editDialogVisible = ref(false);

watch(() => props.stationId, async (id) => {
  if (id) {
    try {
      const res = await fetch(`/api/hydrology_stations/${id}`);
      detail.value = await res.json();
    } catch {
      ElMessage.error('获取水文站详情失败');
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
      `确定要删除水文站"${detail.value?.station_name}"吗？此操作不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );
    
    const response = await fetch(`/api/hydrology_stations/${detail.value.station_code}`, {
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

<style scoped>
.detail-content {
  padding: 20px 0;
}

.detail-item {
  margin-bottom: 12px;
  line-height: 1.6;
}

.label {
  font-weight: 600;
  color: #606266;
  display: inline-block;
  width: 80px;
  text-align: right;
  margin-right: 8px;
}

.value {
  color: #303133;
  word-break: break-all;
}

/* 新增：让el-descriptions两栏等宽，label右对齐，使用:deep()确保生效 */
:deep(.el-descriptions__body .el-descriptions-table) {
  table-layout: fixed;
  width: 100%;
}
:deep(.el-descriptions__label) {
  width: 80px;
  min-width: 80px;
  text-align: right;
  color: #606266;
  font-weight: 500;
}
:deep(.el-descriptions__content) {
  word-break: break-all;
  width: auto;
  min-width: 0;
}
:deep(.el-descriptions__cell) {
  width: 25%;
}
</style> 