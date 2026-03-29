<template>
  <div class="dashboard-analysis">
    <!-- Summary Cards -->
    <div class="row summary-cards">
      <!-- Card 1: Token Usage -->
      <div class="card summary-card">
        <div class="card-header">
          <span>Token Usage</span>
          <span class="tag">Month</span>
        </div>
        <div class="card-body">
          <div class="number">1,234,500</div>
          <div class="trend">
            <span>Total Token Consumption</span>
            <span class="trend-value">8,900,000</span>
          </div>
        </div>
      </div>
      <!-- Card 2: Revenue -->
      <div class="card summary-card">
        <div class="card-header">
          <span>Total Revenue</span>
          <span class="tag">Year</span>
        </div>
        <div class="card-body">
          <div class="number">$ 680,000</div>
          <div class="trend">
            <span>Monthly Revenue</span>
            <span class="trend-value">$ 52,000</span>
          </div>
        </div>
      </div>
      <!-- Card 3: Total Customers -->
      <div class="card summary-card">
        <div class="card-header">
          <span>Total Customers</span>
          <span class="tag">Total</span>
        </div>
        <div class="card-body">
          <div class="number">128</div>
          <div class="trend">
            <span>New This Month</span>
            <span class="trend-value">12</span>
          </div>
        </div>
      </div>
      <!-- Card 4: Total Templates -->
      <div class="card summary-card">
        <div class="card-header">
          <span>Total Templates</span>
          <span class="tag">Library</span>
        </div>
        <div class="card-body">
          <div class="number">356</div>
          <div class="trend">
            <span>New This Week</span>
            <span class="trend-value">8</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Charts Area -->
    <div class="row charts-grid">
      <!-- Chart 1: Model Token Usage -->
      <div class="card chart-card">
        <div class="card-header">
          <span>AI Model Token Usage Trend (MoM)</span>
        </div>
        <div class="chart-container" ref="modelChart"></div>
      </div>

      <!-- Chart 2: Merchant Usage -->
      <div class="card chart-card">
        <div class="card-header">
          <span>Merchant Monthly Usage (Top 5)</span>
        </div>
        <div class="chart-container" ref="merchantChart"></div>
      </div>

      <!-- Chart 3: Event Usage -->
      <div class="card chart-card full-width">
        <div class="card-header">
          <span>Event Activity / Photo Generation Volume</span>
        </div>
        <div class="chart-container" ref="eventChart"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts'

const modelChart = ref(null)
const merchantChart = ref(null)
const eventChart = ref(null)

const charts = {}

const handleResize = () => {
  Object.values(charts).forEach(chart => chart.resize())
}

const initModelChart = () => {
  const myChart = echarts.init(modelChart.value)
  charts.model = myChart

  const option = {
    tooltip: { trigger: 'axis' },
    legend: {
      data: ['GPT-4', 'Midjourney V6', 'Stable Diffusion', 'Runway GEN2'],
      bottom: 0
    },
    grid: { left: '3%', right: '4%', bottom: '10%', top: '10%', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul']
    },
    yAxis: { type: 'value', name: 'Tokens' },
    series: [
      { name: 'GPT-4', type: 'line', data: [12000, 13200, 10100, 13400, 9000, 23000, 21000] },
      { name: 'Midjourney V6', type: 'line', data: [2200, 1820, 1910, 2340, 2900, 3300, 3100] },
      { name: 'Stable Diffusion', type: 'line', data: [1500, 2320, 2010, 1540, 1900, 3300, 4100] },
      { name: 'Runway GEN2', type: 'line', data: [320, 332, 301, 334, 390, 330, 320] }
    ]
  }
  myChart.setOption(option)
}

const initMerchantChart = () => {
  const myChart = echarts.init(merchantChart.value)
  charts.merchant = myChart

  const option = {
    tooltip: { trigger: 'axis' },
    legend: {
      data: ['Shanghai Disneyland', 'Universal Studios Beijing', 'Haidilao', 'NIO', 'PopMart'],
      bottom: 0
    },
    grid: { left: '3%', right: '4%', bottom: '10%', top: '10%', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul']
    },
    yAxis: { type: 'value', name: 'Calls' },
    series: [
      {
        name: 'Shanghai Disneyland',
        type: 'line',
        stack: 'Total',
        data: [820, 932, 901, 934, 1290, 1330, 1320]
      },
      {
        name: 'Universal Studios Beijing',
        type: 'line',
        stack: 'Total',
        data: [732, 901, 934, 1290, 1330, 1320, 1400]
      },
      { name: 'Haidilao', type: 'line', stack: 'Total', data: [120, 132, 101, 134, 90, 230, 210] },
      { name: 'NIO', type: 'line', stack: 'Total', data: [220, 182, 191, 234, 290, 330, 310] },
      { name: 'PopMart', type: 'line', stack: 'Total', data: [150, 232, 201, 154, 190, 330, 410] }
    ]
  }

  myChart.setOption(option)
}

const initEventChart = () => {
  const myChart = echarts.init(eventChart.value)
  charts.event = myChart

  const option = {
    tooltip: { trigger: 'axis' },
    legend: {
      data: ['Princess Transformation Week', 'Harry Potter Magic', 'NIO Day', 'Molly Fantasy'],
      bottom: 0
    },
    grid: { left: '3%', right: '4%', bottom: '10%', top: '10%', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul']
    },
    yAxis: { type: 'value', name: 'Generations' },
    series: [
      { name: 'Princess Transformation Week', type: 'line', smooth: true, data: [100, 200, 500, 800, 1200, 1500, 1800] },
      { name: 'Harry Potter Magic', type: 'line', smooth: true, data: [300, 400, 450, 500, 550, 600, 700] },
      { name: 'NIO Day', type: 'line', smooth: true, data: [50, 80, 100, 150, 300, 0, 0] }, // Ended
      { name: 'Molly Fantasy', type: 'line', smooth: true, data: [0, 0, 200, 400, 600, 800, 1000] }
    ]
  }

  myChart.setOption(option)
}

onMounted(() => {
  initModelChart()
  initMerchantChart()
  initEventChart()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  Object.values(charts).forEach(chart => chart.dispose())
})

defineOptions({
  name: 'DashboardAnalysis'
})
</script>

<style scoped>
.dashboard-analysis {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.row {
  display: flex;
  gap: 16px;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
}

.card {
  background: #fff;
  border-radius: 2px;
  padding: 16px;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.03);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: rgba(0, 0, 0, 0.85);
  font-weight: 500;
  margin-bottom: 12px;
  font-size: 16px;
}

.number {
  font-size: 30px;
  color: #000000d9;
  margin-bottom: 16px;
  line-height: 38px;
}

.trend {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.65);
}

.trend-value {
  margin-left: 8px;
  color: #000000d9;
}

/* Charts Grid */
.charts-grid {
  display: flex;
  flex-wrap: wrap;
}

.chart-card {
  flex: 1;
  min-width: 45%;
  /* Allows 2 per row */
  min-height: 400px;
}

.chart-card.full-width {
  min-width: 100%;
}

.chart-container {
  height: 320px;
  width: 100%;
}

.tabs span {
  margin-right: 24px;
  cursor: pointer;
  padding-bottom: 8px;
}

.tabs span.active {
  color: #0960bd;
  border-bottom: 2px solid #0960bd;
}
</style>
