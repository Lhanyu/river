<template>
  <el-card v-if="visible" class="add-waterlevel-card">
    <div class="card-header">
      <span>添加水位站</span>
      <el-button style="float:right;" size="small" @click="onClose">关闭</el-button>
    </div>
    <el-form :model="form" label-width="120px" :rules="rules" ref="formRef">
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
      <el-form-item label="站点类型" prop="station_type">
        <el-input v-model="form.station_type" />
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
      <el-form-item label="备注" prop="remark">
        <el-input v-model="form.remark" />
      </el-form-item>
      <div style="text-align:right; margin-top:24px;">
        <el-button type="primary" @click="onSubmit">添加</el-button>
      </div>
    </el-form>
  </el-card>
</template>
<script setup>
import { ref, watch } from 'vue';
const props = defineProps({ visible: Boolean });
const emit = defineEmits(['update:visible', 'submit']);
const formRef = ref();
const form = ref({
  station_code: '',
  station_name: '',
  basin_name: '',
  river_system_name: '',
  longitude: '',
  latitude: '',
  station_type: '',
  catchment_area: '',
  setup_year: '',
  setup_month: '',
  province: '',
  city: '',
  county: '',
  town: '',
  village: '',
  river_name: '',
  elevation: '',
  datum_name: '',
  datum_correction: '',
  construction_unit: '',
  management_unit: '',
  survey_team: '',
  remark: ''
});
const rules = {};
const onClose = () => emit('update:visible', false);
const onDialogUpdate = (val) => emit('update:visible', val);
function onSubmit() {
  emit('submit', { ...form.value });
}
function resetForm() {
  Object.keys(form.value).forEach(k => form.value[k] = (k === 'is_boundary_section' ? 0 : ''));
}
watch(() => props.visible, v => { if (!v) resetForm(); });
</script>
<style scoped>
.add-waterlevel-card {
  max-width: 600px;
  margin: 32px auto;
  box-shadow: 0 2px 12px #0001;
}
.card-header {
  font-size: 1.1rem;
  font-weight: 500;
  margin-bottom: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style> 