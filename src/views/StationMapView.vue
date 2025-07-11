<template>
  <el-card class="station-map-card">
    <template #header>
      <div class="card-header">
        <span>测站位置热度分布</span>
        <div class="filters">
          <el-select v-model="selectedBasin" placeholder="选择流域" clearable style="width: 180px; margin-right: 12px;">
            <el-option v-for="b in basinOptions" :key="b.basin_code" :label="b.basin_name" :value="b.basin_code" />
          </el-select>
          <el-select v-model="selectedType" placeholder="选择测站类型" clearable style="width: 180px;">
            <el-option v-for="t in typeOptions" :key="t.value" :label="t.label" :value="t.value" />
          </el-select>
        </div>
      </div>
    </template>
    <div ref="chartRef" class="echarts-map" style="height: 600px; width: 100%;"></div>
  </el-card>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue';
import * as echarts from 'echarts';
import chinaJson from '@/assets/china.json';
import { ElMessage } from 'element-plus';

const chartRef = ref(null);
let chartInstance = null;

const stations = ref([]);
const basinOptions = ref([]);
const selectedBasin = ref();
const typeOptions = ref([
  { label: '水文站', value: 'is_hydrology_station' },
  { label: '水位站', value: 'is_water_level_station' },
  { label: '雨量站', value: 'is_rainfall_station' },
  { label: '蒸发站', value: 'is_evaporation_station' },
  { label: '水质站', value: 'is_water_quality_station' },
  { label: '墒情站', value: 'is_soil_moisture_station' }
]);
const selectedType = ref();

const fetchStations = async () => {
  try {
    const res = await fetch('/api/stations/all');
    const data = await res.json();
    stations.value = data;
    basinOptions.value = [...new Map(data.map(s => [s.basin_code, { basin_code: s.basin_code, basin_name: s.basin_name }])).values()].filter(b => b.basin_code);
  } catch (e) {
    ElMessage.error('获取测站数据失败');
  }
};

const getHeatmapData = () => {
  let filtered = stations.value;
  console.log('原始数据数量:', filtered.length);
  
  if (selectedBasin.value) {
    filtered = filtered.filter(s => s.basin_code === selectedBasin.value);
    console.log('流域筛选后数量:', filtered.length);
  }
  if (selectedType.value) {
    filtered = filtered.filter(s => s[selectedType.value] === 1);
    console.log('类型筛选后数量:', filtered.length);
  }
  return filtered
    .map(s => [
      s.longitude ?? s.lon,
      s.latitude ?? s.lat,
      1
    ])
    .filter(([lon, lat]) => lon && lat);
};

const getScatterData = () => {
  let filtered = stations.value;
  if (selectedBasin.value) {
    filtered = filtered.filter(s => s.basin_code === selectedBasin.value);
  }
  if (selectedType.value) {
    filtered = filtered.filter(s => s[selectedType.value] === 1);
  }
  return filtered
    .filter(s => (s.longitude ?? s.lon) && (s.latitude ?? s.lat))
    .map(s => ({
      value: [s.longitude ?? s.lon, s.latitude ?? s.lat],
      name: s.station_name,
      stationCode: s.station_code,
      basinName: s.basin_name
    }));
};

const renderChart = () => {
  if (!chartRef.value) return;
  if (!chartInstance) {
    chartInstance = echarts.init(chartRef.value);
  }
  if (!echarts.getMap('china')) {
    setTimeout(renderChart, 100);
    return;
  }
  const heatmapData = getHeatmapData();
  const scatterData = getScatterData();
  
  console.log('筛选条件:', { selectedBasin: selectedBasin.value, selectedType: selectedType.value });
  console.log('热力图数据数量:', heatmapData.length);
  console.log('散点图数据数量:', scatterData.length);
  
  // 即使没有数据也显示地图，只是不显示热力图和散点
  chartInstance.setOption({
    title: { left: 'center', text: '' },
    tooltip: { 
      trigger: 'item', 
      formatter: function(params) {
        if (params.seriesType === 'scatter') {
          return `站点名称: ${params.data.name}<br>站点编码: ${params.data.stationCode}<br>经度: ${params.value[0].toFixed(2)}<br>纬度: ${params.value[1].toFixed(2)}<br>流域: ${params.data.basinName || '未知'}`;
        } else {
          return `经度: ${params.value[0]}<br>纬度: ${params.value[1]}`;
        }
      }
    },
    geo: {
      map: 'china', roam: true, label: { show: false }, itemStyle: { areaColor: '#e0e6f1', borderColor: '#888' }, emphasis: { itemStyle: { areaColor: '#bcdcff' } }
    },
    visualMap: {
      min: 0,
      max: 5,
      show: heatmapData.length > 0, // 只有有热力图数据时才显示
      calculable: false,
      inRange: { color: ['#e0ecf7', '#a0c4ff', '#4361ee', '#ff4800'] },
      right: 30,
      top: 30,
      orient: 'vertical',
      text: ['高', '低'],
      itemHeight: 80,
      itemWidth: 10
    },
    series: [
      {
        type: 'heatmap',
        coordinateSystem: 'geo',
        data: heatmapData,
        pointSize: 5,
        blurSize: 10,
        itemStyle: { opacity: 0.9 },
        emphasis: { itemStyle: { opacity: 0.9 } }
      },
      {
        type: 'scatter',
        coordinateSystem: 'geo',
        data: scatterData,
        symbolSize: 4,
        itemStyle: { color: '#d90429', opacity: 0.5 },
        emphasis: { itemStyle: { color: '#ff4800', opacity: 1 } }
      }
    ]
  });
};

onMounted(async () => {
  await fetchStations();
  await nextTick();
  echarts.registerMap('china', chinaJson);
  await nextTick();
  renderChart();
});

watch([selectedBasin, selectedType, stations], async () => {
  await nextTick();
  renderChart();
});
</script>

<style scoped>
.station-map-card {
  margin: 0 40px;
}
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.filters {
  display: flex;
  align-items: center;
}
.echarts-map {
  width: 100%;
  min-height: 500px;
  background: #fff;
}
</style> 