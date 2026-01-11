# User Guide

## Getting Started

Once CamillaNode is installed and running, access the web interface at `http://localhost` (or your configured port).

## Initial Setup

### Connecting to CamillaDSP

1. Navigate to the **Connections** page
2. Enter the following information:
   - **Server**: IP address or hostname (use `localhost` for local connections)
   - **Port**: CamillaDSP WebSocket port (default: `1234`)
   - **Spectrum Port**: Spectrum analyzer port (default: `1235`)
3. Click **Connect**

If you're connecting to a remote CamillaDSP instance, ensure it was started with `-a 0.0.0.0` to bind to all network interfaces.

## Interface Overview

CamillaNode provides a tabbed interface with several pages:

- **Main** - Dashboard and navigation
- **Basic** - Simple tone controls and balance
- **Equalizer** - Advanced parametric equalizer
- **Advanced** - Direct configuration editing
- **Connections** - Server connection settings
- **Preferences** - Application settings and themes
- **Room** - Room correction tools
- **Spectrum** - Real-time spectrum analyzer

## Status Indicators

The top bar displays real-time DSP status:

- **Sampling Rate** - Current audio sample rate
- **Utilization** - CPU/processing load percentage
- **Clipping** - Warning if audio clipping detected
- **Balance** - Current L/R balance setting
- **Crossfeed** - Crossfeed level (dB)
- **Filters** - Number of active filters

## Knobs and Controls

A number of knobs and controls are can be controlled with the mouse's scroll wheel. You will notice that when you mouse over a knob or control, the cursor will change to a hand icon.

## Pages

### Basic Page

![Basic Controls](../public/img/basic.png)

Simple tone controls for quick adjustments:

- **Volume** - Master volume control (-100 dB to 0 dB)
- **Balance** - Left/Right balance adjustment
- **Crossfeed** - Headphone crossfeed effect
- **Tone Controls**:
  - Sub Bass (20-80 Hz)
  - Bass (80-250 Hz)
  - Mids (250-2000 Hz)
  - Upper Mids (2000-6000 Hz)
  - Treble (6000-20000 Hz)

Each tone control provides ±12 dB of adjustment using shelving/peaking filters.

**Interactive graph:** Click a tone marker on the graph to select it. Drag to adjust frequency/gain. Hold **Shift** while dragging to adjust **Q**.

#### Saving Basic Configurations

1. Click the **Manage Configurations** icon in the toolbar
2. Enter a configuration name
3. Click **Save**

#### Loading Basic Configurations

1. Click the **Manage Configurations** icon in the toolbar
2. Select a saved configuration from the list
3. Double-click to load, or select and click **Open**

---

### Equalizer Page

![Equalizer](../public/img/equalizer.png)

Advanced parametric equalizer with visual frequency response.

**Interactive graph:** Click a filter marker on the graph to select the corresponding filter. Drag to adjust frequency/gain; **Shift+drag** adjusts Q.

#### Adding Filters

1. Click the **Add** icon (+ button)
2. A new filter appears in the filter list
3. Adjust filter parameters:
   - **Type**: Peaking, Lowshelf, Highshelf, Lowpass, Highpass, Notch, Bandpass
   - **Frequency** (Hz): Center frequency
   - **Gain** (dB): Boost or cut amount
   - **Q**: Filter bandwidth (narrowness)

#### Editing Filters

**Method 1: Direct Input**
- Click on any parameter value
- Type the new value
- Press Enter to apply

**Method 2: Visual Editor**
- When your mouse hovers over the parameter value use the scroll wheel up and down to adjust the values

---
#### Tools

Load professional headphone/IEM calibration profiles:

1. Click the **AutoEQ** icon in the toolbar
2. Search for your headphone model
3. Select from results:
   - **Oratory1990** measurements
   - **Crinacle** IEM measurements
4. Double-click to load the profile
5. Adjust to taste and save

The AutoEQ database includes hundreds of headphone profiles with correction filters.

#### Importing EQ Settings

Import text-based EQ configurations (EqualizerAPO, REW, etc.):

1. Click **Import** icon
2. Paste filter text in the format:
   ```
   Preamp: -6.0 dB
   Filter 1: ON PK Fc 105 Hz Gain 5.5 dB Q 0.7
   Filter 2: ON PK Fc 2200 Hz Gain -3.2 dB Q 2.5
   ```
3. Click **Import**

Supported formats:
- EqualizerAPO
- REW (Room EQ Wizard)
- AutoEQ format

#### Exporting Configurations

1. Click **Export** icon
2. Choose format (text/JSON)
3. File downloads automatically

---

### Advanced Page

![Advanced](../public/img/advanced.png)

Direct access to CamillaDSP configuration:

- **Raw Config Editor** - Edit YAML configuration directly
- **Pipeline View** - Visual representation of audio routing
- **Mixer Configuration** - Advanced channel mixing
- **Resampling Settings** - Sample rate conversion

**Warning:** Advanced page requires understanding of CamillaDSP configuration format. Incorrect settings may cause audio issues.

---

### Connections Page

![Connections](../public/img/connections.png)

Configure CamillaDSP server connection:

- **Server**: Hostname or IP address
- **Port**: WebSocket port (default: 1234)
- **Spectrum Port**: Spectrum analyzer port (default: 1235)

**Save Connection Profiles:**
1. Enter connection details
2. Click **Save** icon
3. Name the profile
4. Stored profiles appear in the list

**Testing Connection:**
- Connection status shown in real-time
- Green = Connected
- Red = Connection failed
- Yellow = Connecting

---

### Preferences Page

Customize CamillaNode appearance and behavior:

#### Appearance
- **Color Scheme** - Adjust background hue (0-360°)
- **Font Size** - Small, Medium, Large
- **Dark Mode** - Toggle dark/light theme

#### Default Settings
- **Default Page** - Page to load on startup
- **Auto-connect** - Reconnect to last server automatically

#### Advanced Preferences
- **DC Protection** - Enable DC offset blocking filter
- **Auto-save** - Automatically save changes

---

### Room Page [DEV TODO]

Room correction and measurement tools:

- **Measurement** - Capture room response
- **Correction Filters** - Generate correction EQ
- **Target Curves** - Apply house curves

*(Room correction features require compatible measurement hardware)*

---

### Spectrum Page [DEV TODO]

Real-time audio spectrum analyzer:

- **FFT Display** - Frequency spectrum visualization
- **Level Meters** - Input/output level monitoring
- **Peak Hold** - Track maximum levels
- **Freeze** - Pause display for analysis

Useful for:
- Verifying EQ changes
- Detecting resonances
- Monitoring signal levels

---

## Configuration Management

### Saving Configurations

CamillaNode maintains separate configuration profiles for each page:

1. Click the **Config** icon (folder with disk)
2. Enter a configuration name
3. Click **Save**

**What Gets Saved:**
- **Basic**: Volume, balance, crossfeed, tone controls
- **Equalizer**: All filters, mixer settings
- **Connections**: Server connection details

### Loading Configurations

1. Click the **Config** icon
2. Browse saved configurations
3. Select one:
   - Double-click to load
   - Or select and click **Open**

### Deleting Configurations

1. Open configuration manager
2. Select a configuration
3. Click **Delete**
4. Confirm deletion

### Configuration Storage

Configurations are stored:
- **Server-side**: In `savedConfigs.dat` (main storage)
- **Local**: Browser localStorage (for preferences)

---

## Keyboard Shortcuts

- **Ctrl + S** - Save current configuration
- **Ctrl + O** - Open configuration manager
- **Ctrl + E** - Export configuration
- **Ctrl + I** - Import filters
- **Ctrl + Z** - Undo last change
- **Ctrl + Y** - Redo
- **Delete** - Remove selected filter

---

## Tips & Best Practices

### Equalization Tips

1. **Start with AutoEQ** - Load a profile for your headphones as a baseline
2. **Use Subtractive EQ** - Cut problem frequencies rather than boosting
3. **Watch for Clipping** - Monitor the clipping indicator when boosting
4. **Less is More** - Avoid excessive gain adjustments (±3-6 dB is often enough)
5. **Use Q Carefully** - Narrow Q values (>5) can sound unnatural

### Performance Optimization

1. **Minimize Filter Count** - Use only necessary filters
2. **Monitor CPU Usage** - Keep utilization below 80%
3. **Reduce Sample Rate** - If needed, use lower rates (48kHz vs 192kHz)

### Workflow Recommendations

1. **Save Frequently** - Create named snapshots of your work
2. **A/B Testing** - Save variations and compare
3. **Start Basic** - Begin with Basic page, refine in Equalizer
4. **Use Spectrum** - Verify changes with real-time analyzer

---

## Troubleshooting

### No Audio

1. Check CamillaDSP is running: `systemctl status camilladsp`
2. Verify correct audio devices in CamillaDSP config
3. Check system audio routing (ALSA/PulseAudio)

### Clipping Warning

1. Reduce gain on filters with positive dB values
2. Lower master volume
3. Use preamp/gain filter with negative value

### Configuration Won't Save

1. Check file permissions on `savedConfigs.dat`
2. Verify disk space available
3. Check browser console for errors (F12)

### Can't Connect to CamillaDSP

1. Verify CamillaDSP is running
2. Check WebSocket port in camilladsp.service
3. Ensure `-a 0.0.0.0` flag if connecting remotely
4. Check firewall rules

### Changes Not Applied

1. Click the "Upload Config" button after changes
2. Verify CamillaDSP accepted config (check indicators)
3. Restart CamillaDSP if needed: `systemctl restart camilladsp`

---

## Advanced Usage

### Using with Multiple Devices

CamillaNode can control CamillaDSP on different devices:

1. Save connection profiles for each device
2. Switch between profiles in Connections page
3. Each device can have separate saved configurations

### Remote Access

Access CamillaNode from other devices on your network:

1. Find your server's IP address: `hostname -I`
2. On another device, browse to: `http://SERVER_IP:PORT`
3. Configure connection to CamillaDSP

### Integration with Other Tools

- **Export to EqualizerAPO** - Use exported text configs
- **Import from REW** - Paste REW filter text
- **AutoEQ Database** - Direct integration with online database

---

## Support & Resources

- **CamillaDSP Documentation**: [https://github.com/HEnquist/camilladsp](https://github.com/HEnquist/camilladsp)
- **AutoEQ Database**: [https://github.com/jaakkopasanen/AutoEq](https://github.com/jaakkopasanen/AutoEq)
- **CamillaNode Repository**: [https://github.com/ismailAtaman/camillaNode](https://github.com/ismailAtaman/camillaNode)
