# Shanghai Performance Venue Flow Dynamic Map

A web-based interactive map application for visualizing dynamic crowd flow between Shanghai performance venues and nearby metro stations.

## Features

- **Performance Venue Display**: Shows the geographical location of performance venues
- **Nearby Station Markers**: Displays the 5 nearest metro stations for each performance venue
- **Dynamic Flow Animation**: Real-time visualization of entry and exit flow with arrowed lines
- **Flow Visualization**: Line thickness represents flow magnitude
- **Time Control**: Support for play, pause, and reset animation
- **Animation Speed Control**: 30 minutes of map time corresponds to 1 second of real time for easy observation
- **Smart Map Range**: Automatically centers on performance venues with 2km radius display
- **Interactive Interface**: Mouse hover displays detailed information
- **Bilingual Support**: Full English and Chinese language support with toggle functionality
- **Elegant Dark Theme**: Sophisticated art-style design with glassmorphism effects

## File Structure

```
├── start.html          # Launch page (recommended entry point)
├── index.html          # Main HTML file
├── styles.css          # CSS styling file
├── script.js           # JavaScript functionality file
├── data-loader.js      # Data loader utility
├── diagnostic.html     # Diagnostic tools page
├── debug.html          # Debug tools page
├── convert-data.html   # Data conversion tool
├── README.md           # Documentation
└── data/               # Data folder
    ├── shanghai_performances.csv    # Performance venue data
    ├── shanghai_metro_stations.csv  # Metro station data
    ├── event_flow_calculated.csv    # Flow data
    └── refer_flow_per_15.csv        # Reference flow data
```

## Usage

### Quick Start
1. **Open Launch Page**: Open `start.html` in your browser (recommended)
2. **Select Feature**: Choose the desired functionality from the launch page

### Detailed Steps
1. **Test Application**: First open `diagnostic.html` for functionality testing
2. **Convert Data**: Use `convert-data.html` to convert Excel files to CSV format
3. **Open Main Application**: Open `index.html` in your browser
4. **Select Performance**: Choose a performance from the dropdown menu
5. **Control Animation**:
   - Click "Play" button to start animation
   - Click "Pause" button to pause animation
   - Click "Reset" button to restart
6. **View Information**: Hover over venues or stations to see detailed information
7. **Language Toggle**: Click the language button to switch between English and Chinese

## Data Format Specifications

### Performance Venue Data (shanghai_performances.csv)
- `Performance`: Performance name
- `Venue Name`: Venue name
- `geometry`: Venue coordinates (POINT format)
- `Nearest Station 1-5`: 5 nearest metro stations

### Metro Station Data (shanghai_metro_stations.csv)
- `lat`: Latitude
- `lon`: Longitude
- `Station`: Station name
- Other station information

### Flow Data (event_flow_calculated.csv)
- `Performance`: Performance name
- `Station`: Station name
- `Interval Start`: Time interval start
- `Entry Count`: Entry flow count
- `Exit Count`: Exit flow count

### Reference Flow Data (refer_flow_per_15.csv)
- `station`: Station name
- `startTime`: Time interval
- `entry_count`: Entry flow count
- `exit_count`: Exit flow count

## Technical Implementation

- **Frontend Framework**: Native HTML/CSS/JavaScript
- **Visualization Library**: D3.js v7 and Leaflet.js
- **Map Projection**: Mercator projection with OpenStreetMap tiles
- **Animation System**: requestAnimationFrame with controlled speed
- **Responsive Design**: Supports different screen sizes
- **Bilingual System**: Dynamic language switching with data attributes
- **Modern UI**: Dark elegant art style with glassmorphism effects

## Custom Data Setup

To use real data, please:

1. **Convert Data Format**: Use `convert-data.html` tool to convert Excel files to CSV format
2. **Place Data Files**: Put the converted CSV files in the `data` folder
3. **Rename Files**:
   - `shanghai_performances.csv` - Performance venue data
   - `shanghai_metro_stations.csv` - Metro station data
   - `event_flow_calculated.csv` - Flow data
   - `refer_flow_per_15.csv` - Reference flow data
4. **Test Application**: Use `diagnostic.html` to verify data loading

## Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Key Features

### Visual Elements
- **Venue Markers**: Orange circles representing performance venues
- **Station Markers**: Blue circles that dynamically resize based on flow
- **Entry Flow Lines**: Green lines from stations to venues
- **Exit Flow Lines**: Red lines from venues to stations
- **Line Thickness**: Represents flow magnitude (3x enhanced visibility)

### Animation Control
- **Speed**: 40 map minutes per 1 real second
- **Time Display**: Real-time clock showing current map time
- **Flow Updates**: Dynamic station circle sizing and line thickness
- **Interactive Popups**: Detailed information on hover/click

### Language Support
- **Default**: English interface
- **Toggle**: One-click language switching
- **Dynamic**: All text content updates instantly
- **Consistent**: Unified terminology across all pages

## Development Tools

### Diagnostic Tools (`diagnostic.html`)
- Browser support checking
- Data file validation
- Animation speed testing
- Map projection testing
- Common issue troubleshooting

### Debug Tools (`debug.html`)
- Data loading testing
- Map rendering verification
- Real-time log display
- Error diagnostics

### Data Conversion (`convert-data.html`)
- Excel to CSV conversion
- Data preview functionality
- Batch file processing
- Download management

## Notes

- Current version uses mock data by default
- Map range is set for Shanghai area
- Flow animation plays by time intervals
- Supports responsive layout
- All pages feature elegant dark art style
- Full bilingual support with English default
- Enhanced visual effects for better visibility

## Local Development

1. **Start Server**: Run `python -m http.server 8000`
2. **Access Application**: Open `http://localhost:8000/start.html`
3. **Test Features**: Use diagnostic and debug tools as needed
4. **Customize Data**: Replace mock data with real CSV files

## Performance Optimization

- Efficient data loading with async/await
- Optimized animation loops
- Responsive map rendering
- Memory management for large datasets
- Progressive enhancement for older browsers 