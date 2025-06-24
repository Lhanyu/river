<template>
  <el-dialog :model-value="visible" :title="isAdd ? '添加雨量站' : '编辑雨量站'" width="900px" @close="onClose" @update:model-value="onDialogUpdate">
    <el-form v-if="form" :model="form" label-width="120px" ref="formRef">
      <el-row :gutter="24">
        <el-col :span="12">
          <el-form-item label="测站编码" prop="station_code">
            <el-input v-model="form.station_code" />
          </el-form-item>
          <el-form-item label="测站名称" prop="station_name">
            <el-input v-model="form.station_name" />
          </el-form-item>
          <el-form-item label="流域" prop="basin_name">
            <el-input v-model="form.basin_name" />
          </el-form-item>
          <el-form-item label="经度" prop="longitude">
            <el-input v-model="form.longitude" type="number" />
          </el-form-item>
          <el-form-item label="纬度" prop="latitude">
            <el-input v-model="form.latitude" type="number" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="管理单位" prop="management_unit">
            <el-input v-model="form.management_unit" />
          </el-form-item>
          <el-form-item label="器口高度(m)" prop="orifice_height">
            <el-input v-model="form.orifice_height" type="number" />
          </el-form-item>
          <el-form-item label="多年平均降雨量(mm)" prop="avg_rainfall">
            <el-input v-model="form.avg_rainfall" type="number" />
          </el-form-item>
          <el-form-item label="实测年最大降雨量(mm)" prop="max_rainfall">
            <el-input v-model="form.max_rainfall" type="number" />
          </el-form-item>
          <el-form-item label="出现年份" prop="max_rainfall_year">
            <el-input v-model="form.max_rainfall_year" />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="备注" prop="remark">
            <el-input v-model="form.remark" />
          </el-form-item>
        </el-col>
      </el-row>
      <div style="text-align:right; margin-top:24px;">
        <el-button @click="onClose">取消</el-button>
        <el-button type="primary" @click="onSave">{{ isAdd ? '添加' : '修改' }}</el-button>
      </div>
    </el-form>
    <div v-else>加载中...</div>
  </el-dialog>
</template>

<script setup>
import { ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
const props = defineProps({ visible: Boolean, stationData: Object, isAdd: Boolean });
const emit = defineEmits(['update:visible', 'saved']);
const form = ref(null);
const formRef = ref();
watch(() => props.stationData, (data) => {
  if (data) {
    form.value = { ...data };
  }
}, { immediate: true });
const onClose = () => emit('update:visible', false);
const onDialogUpdate = (val) => emit('update:visible', val);
async function onSave() {
  if (!form.value) return;
  try {
    // 直接调用POST接口进行覆写，不调用DELETE接口
    // 这样可以避免在"先删后增"模式下删除主表stations记录
    const saveData = {
      station_id: form.value.station_id,
      station_name: form.value.station_name || '',
      station_code: form.value.station_code || '',
      basin_name: form.value.basin_name || '',
      river_system_name: form.value.river_system_name || null,
      longitude: form.value.longitude ? parseFloat(form.value.longitude) : null,
      latitude: form.value.latitude ? parseFloat(form.value.latitude) : null,
      management_unit: form.value.management_unit || '',
      orifice_height: form.value.orifice_height ? parseFloat(form.value.orifice_height) : null,
      avg_rainfall: form.value.avg_rainfall ? parseFloat(form.value.avg_rainfall) : null,
      max_rainfall: form.value.max_rainfall ? parseFloat(form.value.max_rainfall) : null,
      max_rainfall_year: form.value.max_rainfall_year || '',
      remark: form.value.remark || ''
    };
    const response = await fetch('/api/rainfall_stations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(saveData)
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || '保存失败');
    }
    const result = await response.json();
    ElMessage.success(result.message || (isAdd ? '添加成功' : '修改成功'));
    emit('saved');
    onClose();
  } catch (error) {
    console.error('保存失败:', error);
    ElMessage.error(error.message || '保存失败，请重试');
  }
}
</script> 