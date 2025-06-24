<template>
  <el-dialog :model-value="visible" :title="isAdd ? '添加水文站' : '编辑水文站'" width="900px" @close="onClose" @update:model-value="onDialogUpdate">
    <el-form v-if="form" :model="form" label-width="150px" ref="formRef">
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
          <el-form-item label="水系" prop="river_system_name">
            <el-input v-model="form.river_system_name" />
          </el-form-item>
          <el-form-item label="经度" prop="longitude">
            <el-input v-model="form.longitude" type="number" />
          </el-form-item>
          <el-form-item label="纬度" prop="latitude">
            <el-input v-model="form.latitude" type="number" />
          </el-form-item>
          <el-form-item label="集水面积" prop="catchment_area">
            <el-input v-model="form.catchment_area" type="number" />
          </el-form-item>
          <el-form-item label="设站年份" prop="setup_year">
            <el-input v-model="form.setup_year" type="number" />
          </el-form-item>
          <el-form-item label="设站月份" prop="setup_month">
            <el-input v-model="form.setup_month" type="number" />
          </el-form-item>
          <el-form-item label="省" prop="province">
            <el-input v-model="form.province" />
          </el-form-item>
          <el-form-item label="市" prop="city">
            <el-input v-model="form.city" />
          </el-form-item>
          <el-form-item label="县" prop="county">
            <el-input v-model="form.county" />
          </el-form-item>
          <el-form-item label="全年平均径流量(亿m³)" prop="annual_runoff">
            <el-input v-model="form.annual_runoff" type="number" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="最小流量" prop="min_flow">
            <el-input v-model="form.min_flow" type="number" />
          </el-form-item>
          <el-form-item label="最小流量时间" prop="min_flow_time">
            <el-input v-model="form.min_flow_time" />
          </el-form-item>
          <el-form-item label="乡镇" prop="town">
            <el-input v-model="form.town" />
          </el-form-item>
          <el-form-item label="村街道" prop="village">
            <el-input v-model="form.village" />
          </el-form-item>
          <el-form-item label="河流" prop="river_name">
            <el-input v-model="form.river_name" />
          </el-form-item>
          <el-form-item label="测站高程" prop="elevation">
            <el-input v-model="form.elevation" type="number" />
          </el-form-item>
          <el-form-item label="基面名称" prop="datum_name">
            <el-input v-model="form.datum_name" />
          </el-form-item>
          <el-form-item label="基面修正值" prop="datum_correction">
            <el-input v-model="form.datum_correction" type="number" />
          </el-form-item>
          <el-form-item label="建设单位" prop="construction_unit">
            <el-input v-model="form.construction_unit" />
          </el-form-item>
          <el-form-item label="管理单位" prop="management_unit">
            <el-input v-model="form.management_unit" />
          </el-form-item>
          <el-form-item label="所属勘测队" prop="survey_team">
            <el-input v-model="form.survey_team" />
          </el-form-item>
          <el-form-item label="最大流量" prop="max_flow">
            <el-input v-model="form.max_flow" type="number" />
          </el-form-item>
          <el-form-item label="最大流量时间" prop="max_flow_time">
            <el-input v-model="form.max_flow_time" />
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

const props = defineProps({ 
  visible: Boolean, 
  stationData: Object,
  isAdd: Boolean // 新增属性，true为添加，false为编辑
});

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
      basin_name: form.value.basin_name || null,
      river_system_name: form.value.river_system_name || null,
      longitude: form.value.longitude ? parseFloat(form.value.longitude) : null,
      latitude: form.value.latitude ? parseFloat(form.value.latitude) : null,
      catchment_area: form.value.catchment_area ? parseFloat(form.value.catchment_area) : null,
      setup_year: form.value.setup_year ? parseInt(form.value.setup_year) : null,
      setup_month: form.value.setup_month ? parseInt(form.value.setup_month) : null,
      province: form.value.province || null,
      city: form.value.city || null,
      county: form.value.county || null,
      town: form.value.town || null,
      village: form.value.village || null,
      river_name: form.value.river_name || null,
      construction_unit: form.value.construction_unit || null,
      management_unit: form.value.management_unit || null,
      survey_team: form.value.survey_team || null,
      elevation: form.value.elevation ? parseFloat(form.value.elevation) : null,
      datum_name: form.value.datum_name || null,
      datum_correction: form.value.datum_correction ? parseFloat(form.value.datum_correction) : null,
      annual_runoff: form.value.annual_runoff ? parseFloat(form.value.annual_runoff) : null,
      max_flow: form.value.max_flow ? parseFloat(form.value.max_flow) : null,
      max_flow_time: form.value.max_flow_time || null,
      min_flow: form.value.min_flow ? parseFloat(form.value.min_flow) : null,
      min_flow_time: form.value.min_flow_time || null,
      remark: form.value.remark || null
    };
    // 调用后端API保存
    const response = await fetch('/api/hydrology_stations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(saveData)
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || '保存失败');
    }
    const result = await response.json();
    ElMessage.success(result.message || (props.isAdd ? '添加成功' : '修改成功'));
    emit('saved');
    onClose();
  } catch (error) {
    console.error('保存失败:', error);
    ElMessage.error(error.message || '保存失败，请重试');
  }
}
</script> 