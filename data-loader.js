// 数据加载器 - 用于从CSV文件加载真实数据
class DataLoader {
    constructor() {
        this.performances = [];
        this.stations = [];
        this.flowData = [];
        this.referFlowData = [];
    }

    // 加载所有数据
    async loadAllData() {
        try {
            await Promise.all([
                this.loadPerformances(),
                this.loadStations(),
                this.loadFlowData()
            ]);
            
            return {
                performances: this.performances,
                stations: this.stations,
                flowData: this.flowData,
                referFlowData: this.referFlowData || []
            };
        } catch (error) {
            console.error('数据加载失败:', error);
            return null;
        }
    }

    // 加载表演场地数据
    async loadPerformances() {
        try {
            const response = await fetch('data/shanghai_performances.csv');
            const csvText = await response.text();
            const data = this.parseCSV(csvText);
            
            this.performances = data.map(row => ({
                id: this.generateId(row.Performance),
                name: row.Performance,
                venue: row['Venue Name'],
                geometry: row.geometry,
                nearestStations: [
                    row['Nearest Station 1'],
                    row['Nearest Station 2'],
                    row['Nearest Station 3'],
                    row['Nearest Station 4'],
                    row['Nearest Station 5']
                ].filter(station => station && station.trim() !== '')
            }));
            
            console.log('表演场地数据加载完成:', this.performances.length);
        } catch (error) {
            console.error('加载表演场地数据失败:', error);
            // 使用模拟数据作为后备
            this.performances = this.getMockPerformances();
        }
    }

    // 加载地铁站数据
    async loadStations() {
        try {
            const response = await fetch('data/shanghai_metro_stations.csv');
            const csvText = await response.text();
            const data = this.parseCSV(csvText);
            
            this.stations = data.map(row => ({
                name: row.Station || row.name || row.station_name || row.Name,
                lat: parseFloat(row.lat),
                lon: parseFloat(row.lon || row.lng)
            })).filter(station => 
                !isNaN(station.lat) && !isNaN(station.lon) &&
                station.name && station.name.trim() !== ''
            );
            
            console.log('地铁站数据加载完成:', this.stations.length);
        } catch (error) {
            console.error('加载地铁站数据失败:', error);
            // 使用模拟数据作为后备
            this.stations = this.getMockStations();
        }
    }

    // 加载流量数据
    async loadFlowData() {
        try {
            // 加载表演流量数据
            const response = await fetch('data/event_flow_calculated.csv');
            const csvText = await response.text();
            const data = this.parseCSV(csvText);
            
            this.flowData = data.map(row => ({
                performance: row.Performance,
                station: row.Station,
                interval: row['Interval Start'],
                entryCount: parseInt(row['Entry Count']) || 0,
                exitCount: parseInt(row['Exit Count']) || 0,
                startTime: row['Interval Start'],
                endTime: row['Interval Start'] // 使用相同时间作为结束时间
            })).filter(flow => 
                flow.performance && flow.performance.trim() !== '' &&
                flow.station && flow.station.trim() !== '' &&
                (flow.entryCount > 0 || flow.exitCount > 0)
            );
            
            // 加载参考流量数据
            const refResponse = await fetch('data/refer_flow_per_15.csv');
            const refCsvText = await refResponse.text();
            const refData = this.parseCSV(refCsvText);
            
            this.referFlowData = refData.map(row => ({
                station: row.station,
                interval: row.interval_start,
                entryCount: parseInt(row.entry_count) || 0,
                exitCount: parseInt(row.exit_count) || 0,
                startTime: row.interval_start
            })).filter(flow => 
                flow.station && flow.station.trim() !== '' &&
                (flow.entryCount > 0 || flow.exitCount > 0)
            );
            
            console.log('表演流量数据加载完成:', this.flowData.length);
            console.log('参考流量数据加载完成:', this.referFlowData.length);
        } catch (error) {
            console.error('加载流量数据失败:', error);
            // 使用模拟数据作为后备
            this.flowData = this.getMockFlowData();
            this.referFlowData = [];
        }
    }

    // 解析CSV文本
    parseCSV(csvText) {
        const lines = csvText.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        
        return lines.slice(1).map(line => {
            // 更复杂的CSV解析，处理引号内的逗号
            const values = [];
            let current = '';
            let inQuotes = false;
            
            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    values.push(current.trim());
                    current = '';
                } else {
                    current += char;
                }
            }
            values.push(current.trim()); // 添加最后一个值
            
            const row = {};
            headers.forEach((header, index) => {
                row[header] = (values[index] || '').replace(/"/g, '');
            });
            return row;
        }).filter(row => 
            Object.values(row).some(value => value && value.trim() !== '')
        );
    }

    // 生成ID
    generateId(name) {
        return 'perf_' + name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    }

    // 获取模拟表演数据
    getMockPerformances() {
        return [
            {
                id: "perf1",
                name: "上海大剧院演出",
                venue: "上海大剧院",
                geometry: "POINT(121.4758 31.2397)",
                nearestStations: ["人民广场站", "南京东路站", "陆家嘴站", "豫园站", "外滩站"]
            },
            {
                id: "perf2", 
                name: "东方艺术中心音乐会",
                venue: "东方艺术中心",
                geometry: "POINT(121.5444 31.2211)",
                nearestStations: ["世纪大道站", "陆家嘴站", "东昌路站", "浦电路站", "蓝村路站"]
            },
            {
                id: "perf3",
                name: "上海音乐厅古典音乐会",
                venue: "上海音乐厅", 
                geometry: "POINT(121.4803 31.2334)",
                nearestStations: ["人民广场站", "南京东路站", "豫园站", "外滩站", "陆家嘴站"]
            }
        ];
    }

    // 获取模拟车站数据
    getMockStations() {
        return [
            { name: "人民广场站", lat: 31.2334, lon: 121.4803 },
            { name: "南京东路站", lat: 31.2397, lon: 121.4758 },
            { name: "陆家嘴站", lat: 31.2211, lon: 121.5444 },
            { name: "豫园站", lat: 31.2274, lon: 121.4924 },
            { name: "外滩站", lat: 31.2334, lon: 121.4903 },
            { name: "世纪大道站", lat: 31.2211, lon: 121.5444 },
            { name: "东昌路站", lat: 31.2211, lon: 121.5444 },
            { name: "浦电路站", lat: 31.2211, lon: 121.5444 },
            { name: "蓝村路站", lat: 31.2211, lon: 121.5444 }
        ];
    }

    // 获取模拟流量数据
    getMockFlowData() {
        return [
            {
                performance: "perf1",
                interval: "18:00-18:15",
                entryCount: 150,
                exitCount: 50,
                startTime: "18:00",
                endTime: "18:15"
            },
            {
                performance: "perf1", 
                interval: "18:15-18:30",
                entryCount: 200,
                exitCount: 75,
                startTime: "18:15",
                endTime: "18:30"
            },
            {
                performance: "perf1",
                interval: "18:30-18:45", 
                entryCount: 180,
                exitCount: 100,
                startTime: "18:30",
                endTime: "18:45"
            },
            {
                performance: "perf2",
                interval: "19:00-19:15",
                entryCount: 120,
                exitCount: 30,
                startTime: "19:00",
                endTime: "19:15"
            },
            {
                performance: "perf2",
                interval: "19:15-19:30", 
                entryCount: 160,
                exitCount: 60,
                startTime: "19:15",
                endTime: "19:30"
            },
            {
                performance: "perf3",
                interval: "20:00-20:15",
                entryCount: 90,
                exitCount: 20,
                startTime: "20:00",
                endTime: "20:15"
            },
            {
                performance: "perf3",
                interval: "20:15-20:30",
                entryCount: 110,
                exitCount: 40,
                startTime: "20:15",
                endTime: "20:30"
            }
        ];
    }
}

// 导出数据加载器
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataLoader;
} 