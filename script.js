// 全局变量
let map;
let currentTime = 0;
let isPlaying = false;
let selectedPerformance = null;
let flowData = [];
let timeIntervals = [];
let appData = null;
let venueMarker = null;
let stationMarkers = [];
let flowLines = [];
let currentLanguage = 'en'; // 默认英文

// 数据加载器实例
const dataLoader = new DataLoader();

// 初始化应用
async function init() {
    setupMap();
    setupEventListeners();
    
    // 加载数据
    appData = await dataLoader.loadAllData();
    if (appData) {
        loadPerformanceData();
    } else {
        console.error('数据加载失败，使用模拟数据');
        // 使用模拟数据作为后备
        appData = {
            performances: dataLoader.getMockPerformances(),
            stations: dataLoader.getMockStations(),
            flowData: dataLoader.getMockFlowData()
        };
        loadPerformanceData();
    }
}

// 设置地图
function setupMap() {
    // 初始化Leaflet地图
    map = L.map('map').setView([31.23, 121.48], 13);
    
    // 添加OpenStreetMap底图
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18
    }).addTo(map);
    
    console.log('地图初始化完成');
}

// 设置事件监听器
function setupEventListeners() {
    document.getElementById('performance-select').addEventListener('change', onPerformanceSelect);
    document.getElementById('play-btn').addEventListener('click', playAnimation);
    document.getElementById('pause-btn').addEventListener('click', pauseAnimation);
    document.getElementById('reset-btn').addEventListener('click', resetAnimation);
    document.getElementById('language-toggle').addEventListener('click', toggleLanguage);
}

// 加载表演数据
function loadPerformanceData() {
    const select = document.getElementById('performance-select');
    
    // 清空选项
    select.innerHTML = '<option value="">' + getText('Please select a performance') + '</option>';
    
    // 添加表演选项
    appData.performances.forEach(perf => {
        const option = document.createElement('option');
        option.value = perf.id;
        option.textContent = perf.name;
        select.appendChild(option);
    });
}

// 表演选择事件
function onPerformanceSelect(event) {
    selectedPerformance = event.target.value;
    if (selectedPerformance) {
        renderMap();
        resetAnimation();
    }
}

// 渲染地图
function renderMap() {
    if (!selectedPerformance) return;
    
    const performance = appData.performances.find(p => p.id === selectedPerformance);
    if (!performance) return;
    
    console.log('渲染地图 - 选中的表演:', performance);
    
    // 清除现有标记
    clearMap();
    
    // 解析表演场地坐标
    const venueCoords = parseGeometry(performance.geometry);
    console.log('场地坐标:', venueCoords);
    console.log('原始geometry:', performance.geometry);
    
    // 设置地图中心
    map.setView([venueCoords[1], venueCoords[0]], 14);
    
    // 绘制表演场地
    venueMarker = L.circleMarker([venueCoords[1], venueCoords[0]], {
        radius: 10,
        fillColor: '#e67e22', // 橙色，与图例一致
        color: '#d35400',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.9
    }).addTo(map);
    
    venueMarker.bindPopup(`<strong>${performance.venue}</strong><br/>${currentLanguage === 'en' ? 'Performance: ' : '表演：'}${performance.name}`);
    
    // 绘制附近车站
    console.log('表演场地:', performance.venue);
    console.log('附近车站列表:', performance.nearestStations);
    console.log('可用车站数据:', appData.stations.map(s => s.name));
    
    performance.nearestStations.forEach(stationName => {
        console.log('查找车站:', stationName);
        const station = appData.stations.find(s => s.name === stationName);
        if (station) {
            console.log('找到车站:', station.name, '坐标:', [station.lat, station.lon]);
            
            // 创建车站标记，但圆圈大小将在动画中动态更新
            const stationMarker = L.circleMarker([station.lat, station.lon], {
                radius: 8, // 初始大小
                fillColor: '#3498db', // 蓝色，与图例一致
                color: '#2980b9',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.9
            }).addTo(map);
            
            // 存储车站信息，用于动态更新
            stationMarker.stationName = stationName;
            stationMarker.station = station;
            stationMarker.performance = performance;
            
            stationMarker.bindPopup(`<strong>${station.name}</strong><br/>${currentLanguage === 'en' ? 'Current Flow: Calculating...' : '当前流量：计算中...'}`);
            stationMarkers.push(stationMarker);
        } else {
            console.warn('未找到车站:', stationName);
        }
    });
    
    // 准备流量数据 - 按表演名称和车站分组
    flowData = appData.flowData.filter(f => f.performance === performance.name);
    
    // 按时间间隔分组流量数据
    const flowByTime = {};
    flowData.forEach(f => {
        const timeKey = f.startTime;
        if (!flowByTime[timeKey]) {
            flowByTime[timeKey] = [];
        }
        flowByTime[timeKey].push(f);
    });
    
    timeIntervals = Object.keys(flowByTime).map(timeKey => ({
        start: parseTime(timeKey),
        end: parseTime(timeKey) + 15, // 15分钟间隔
        data: flowByTime[timeKey] // 包含该时间点的所有车站流量数据
    }));
    
    console.log('流量数据:', flowData.length, '条记录');
    console.log('时间间隔:', timeIntervals.length, '个间隔');
    console.log('按时间分组的流量数据:', flowByTime);
}

// 清除地图
function clearMap() {
    if (venueMarker) {
        map.removeLayer(venueMarker);
        venueMarker = null;
    }
    
    stationMarkers.forEach(marker => {
        map.removeLayer(marker);
    });
    stationMarkers = [];
    
    flowLines.forEach(line => {
        map.removeLayer(line);
    });
    flowLines = [];
}

// 解析几何坐标
function parseGeometry(geometry) {
    if (!geometry || geometry.trim() === '') {
        console.warn('缺少geometry数据，使用默认坐标');
        return [121.4758, 31.2397]; // 默认坐标
    }
    
    // 支持多种POINT格式
    const match = geometry.match(/POINT\s*\(([^)]+)\)/);
    if (match) {
        const coords = match[1].trim().split(/\s+/);
        if (coords.length >= 2) {
            const lon = parseFloat(coords[0]);
            const lat = parseFloat(coords[1]);
            console.log('解析坐标:', geometry, '->', [lon, lat]);
            return [lon, lat];
        }
    }
    
    console.warn('无法解析geometry格式:', geometry, '使用默认坐标');
    return [121.4758, 31.2397]; // 默认坐标
}

// 解析时间
function parseTime(timeStr) {
    // 处理完整日期时间格式 "2025-05-28 18:15:00"
    const timePart = timeStr.split(' ')[1] || timeStr;
    const [hours, minutes] = timePart.split(':').map(Number);
    return hours * 60 + minutes;
}

// 播放动画
function playAnimation() {
    if (!selectedPerformance || isPlaying) return;
    
    isPlaying = true;
    currentTime = timeIntervals[0] ? timeIntervals[0].start : 0;
    let lastFrameTime = Date.now();
    
    console.log('开始动画，初始时间:', currentTime);
    console.log('时间间隔数量:', timeIntervals.length);
    
    function animate() {
        if (!isPlaying) return;
        
        const now = Date.now();
        const elapsed = now - lastFrameTime;
        
        // 控制动画速度：每秒现实时间对应40分钟地图时间（八倍速度）
        const timeIncrement = (elapsed / 1000) * 40;
        const maxIncrement = 8; // 最大单次增量8分钟
        const actualIncrement = Math.min(timeIncrement, maxIncrement);
        
        console.log('动画帧:', {
            elapsed: elapsed + 'ms',
            timeIncrement: timeIncrement + '分钟',
            actualIncrement: actualIncrement + '分钟',
            currentTime: currentTime + '分钟'
        });
        
        updateFlowDisplay();
        updateTimeDisplay();
        
        const currentInterval = timeIntervals.find(t => 
            currentTime >= t.start && currentTime < t.end
        );
        
        if (currentInterval) {
            currentTime += actualIncrement;
        } else {
            // 移动到下一个时间间隔
            const nextInterval = timeIntervals.find(t => t.start > currentTime);
            if (nextInterval) {
                currentTime = nextInterval.start;
            } else {
                // 重新开始
                currentTime = timeIntervals[0] ? timeIntervals[0].start : 0;
            }
        }
        
        lastFrameTime = now;
        requestAnimationFrame(animate);
    }
    
    animate();
}

// 暂停动画
function pauseAnimation() {
    isPlaying = false;
}

// 重置动画
function resetAnimation() {
    pauseAnimation();
    currentTime = timeIntervals[0] ? timeIntervals[0].start : 0;
    updateFlowDisplay();
    updateTimeDisplay();
}

// 更新流量显示
function updateFlowDisplay() {
    // 清除现有流量线
    flowLines.forEach(line => {
        map.removeLayer(line);
    });
    flowLines = [];
    
    const currentInterval = timeIntervals.find(t => 
        currentTime >= t.start && currentTime < t.end
    );
    
    if (!currentInterval) {
        console.log('当前时间:', currentTime, '分钟，未找到对应的时间间隔');
        return;
    }
    
    console.log('当前时间间隔:', currentInterval);
    
    const performance = appData.performances.find(p => p.id === selectedPerformance);
    const venueCoords = parseGeometry(performance.geometry);
    
    // 更新车站圆圈大小和流量线
    stationMarkers.forEach(stationMarker => {
        const stationName = stationMarker.stationName;
        
        // 获取当前时间点的流量数据
        const currentTimeStr = formatTimeForData(currentTime);
        
        // 查找当前时间点的表演流量
        const currentPerformanceFlow = currentInterval.data.find(f => 
            f.station === stationName
        );
        
        // 查找当前时间点的参考流量
        const currentReferFlow = appData.referFlowData.find(f => 
            f.station === stationName && f.startTime === currentTimeStr
        );
        
        // 计算当前时间点的总流量
        const currentEntryCount = (currentPerformanceFlow ? currentPerformanceFlow.entryCount : 0) +
                                (currentReferFlow ? currentReferFlow.entryCount : 0);
        const currentExitCount = (currentPerformanceFlow ? currentPerformanceFlow.exitCount : 0) +
                               (currentReferFlow ? currentReferFlow.exitCount : 0);
        const currentTotalFlow = currentEntryCount + currentExitCount;
        
                 // 更新圆圈大小 - 增加变化幅度
         const baseRadius = 8;
         const flowRadius = Math.max(baseRadius, Math.min(35, baseRadius + currentTotalFlow * 0.3)); // 增加3倍变化幅度
         stationMarker.setRadius(flowRadius);
        
        // 更新弹窗信息
        stationMarker.bindPopup(`<strong>${stationMarker.station.name}</strong><br/>${currentLanguage === 'en' ? 'Current Flow: ' : '当前流量：'}${currentTotalFlow}${currentLanguage === 'en' ? ' people' : '人'}<br/>${currentLanguage === 'en' ? 'Entry: ' : '入场：'}${currentEntryCount}${currentLanguage === 'en' ? ' people' : '人'}<br/>${currentLanguage === 'en' ? 'Exit: ' : '出场：'}${currentExitCount}${currentLanguage === 'en' ? ' people' : '人'}<br/>${currentLanguage === 'en' ? 'Time: ' : '时间：'}${formatTimeDisplay(currentTime)}`);
        
        console.log(`车站 ${stationName} 当前流量:`, {
            time: formatTimeDisplay(currentTime),
            currentEntryCount,
            currentExitCount,
            currentTotalFlow,
            flowRadius
        });
    });
    
    // 绘制入场流量线 - 使用真实流量数据
    currentInterval.data.forEach(flowRecord => {
        if (flowRecord.entryCount > 0) {
            const station = appData.stations.find(s => s.name === flowRecord.station);
            if (station) {
                                 const line = L.polyline([
                     [station.lat, station.lon],
                     [venueCoords[1], venueCoords[0]]
                 ], {
                     color: '#27ae60', // 绿色，与图例一致
                     weight: Math.max(3, flowRecord.entryCount * 1.5), // 增加3倍线条粗细变化
                     opacity: 0.9
                 }).addTo(map);
                
                line.bindPopup(`${currentLanguage === 'en' ? 'Entry Flow: ' : '入场流量：'}${flowRecord.entryCount}${currentLanguage === 'en' ? ' people' : '人'}<br/>${currentLanguage === 'en' ? 'From ' : '从 '}${station.name} ${currentLanguage === 'en' ? 'to ' : '到 '}${performance.venue}`);
                flowLines.push(line);
            }
        }
    });
    
    // 绘制出场流量线 - 使用真实流量数据
    currentInterval.data.forEach(flowRecord => {
        if (flowRecord.exitCount > 0) {
            const station = appData.stations.find(s => s.name === flowRecord.station);
            if (station) {
                                 const line = L.polyline([
                     [venueCoords[1], venueCoords[0]],
                     [station.lat, station.lon]
                 ], {
                     color: '#e74c3c', // 红色，与图例一致
                     weight: Math.max(3, flowRecord.exitCount * 1.5), // 增加3倍线条粗细变化
                     opacity: 0.9
                 }).addTo(map);
                
                line.bindPopup(`${currentLanguage === 'en' ? 'Exit Flow: ' : '出场流量：'}${flowRecord.exitCount}${currentLanguage === 'en' ? ' people' : '人'}<br/>${currentLanguage === 'en' ? 'From ' : '从 '}${performance.venue} ${currentLanguage === 'en' ? 'to ' : '到 '}${station.name}`);
                flowLines.push(line);
            }
        }
    });
}

// 格式化时间显示
function formatTimeDisplay(timeInMinutes) {
    const hours = Math.floor(timeInMinutes / 60);
    const minutes = Math.floor(timeInMinutes % 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

// 格式化时间为数据格式
function formatTimeForData(timeInMinutes) {
    const hours = Math.floor(timeInMinutes / 60);
    const minutes = Math.floor(timeInMinutes % 60);
    // 格式化为 "HH:MM:00" 以匹配数据格式
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
}

// 语言切换功能
function toggleLanguage() {
    currentLanguage = currentLanguage === 'en' ? 'zh' : 'en';
    updatePageLanguage();
}

// 获取当前语言的文本
function getText(key) {
    const elements = document.querySelectorAll(`[data-${currentLanguage}="${key}"]`);
    if (elements.length > 0) {
        return elements[0].getAttribute(`data-${currentLanguage}`);
    }
    return key; // 如果没有找到，返回原键值
}

// 更新页面语言
function updatePageLanguage() {
    // 更新所有带有data-en和data-zh属性的元素
    const elements = document.querySelectorAll('[data-en][data-zh]');
    elements.forEach(element => {
        const text = getText(element.getAttribute(`data-${currentLanguage === 'en' ? 'en' : 'zh'}`));
        if (text) {
            element.textContent = text;
        }
    });
    
    // 更新HTML lang属性
    document.documentElement.lang = currentLanguage === 'en' ? 'en' : 'zh-CN';
    
    // 更新弹窗内容（如果地图已渲染）
    if (venueMarker) {
        updatePopupContent();
    }
}

// 更新弹窗内容
function updatePopupContent() {
    const performance = appData.performances.find(p => p.id === selectedPerformance);
    if (performance) {
        venueMarker.bindPopup(`<strong>${performance.venue}</strong><br/>${currentLanguage === 'en' ? 'Performance: ' : '表演：'}${performance.name}`);
    }
    
    stationMarkers.forEach(stationMarker => {
        stationMarker.bindPopup(`<strong>${stationMarker.station.name}</strong><br/>${currentLanguage === 'en' ? 'Current Flow: Calculating...' : '当前流量：计算中...'}`);
    });
}

// 更新时间显示
function updateTimeDisplay() {
    const timeStr = formatTimeDisplay(currentTime);
    document.getElementById('current-time').textContent = timeStr;
}

// 初始化应用
document.addEventListener('DOMContentLoaded', init); 