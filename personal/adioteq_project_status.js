const projectsData =[
	{
        "projectName": "Iot Smart Alarm (Esp32s3) - PCB Generation & Bring-up",
        "steps": [
            { "id": 1, "label": "Schematic Design", "subtext": "Components & Netlist", "status": "completed" },
            { "id": 2, "label": "PCB Layout & Routing", "subtext": "Placement & Traces", "status": "completed" },
            { "id": 3, "label": "DFM / DRC Validation", "subtext": "Manufacturing Checks", "status": "completed" },
            { "id": 4, "label": "Gerber & BOM Export", "subtext": "Fabrication Package", "status": "completed" },
            { "id": 5, "label": "Bare-Board Fab", "subtext": "Substrate & Copper", "status": "completed" },
            { "id": 6, "label": "PCBA Assembly (SMT)", "subtext": "Pick & Place / Reflow", "status": "completed" },
            { "id": 7, "label": "Initial Bring-up", "subtext": "Power Rails & Shorts Check", "status": "completed" },
            { "id": 8, "label": "Functional Hardware Test", "subtext": "Signal integrity & Validation", "status": "completed" }
        ]
    },
	{
		"projectName": "Iot Smart Alarm (Esp32s3) - Firmware",
		"steps": [
			{ "id": 1, "label": "Architecture & Environment Setup", "subtext": "Toolchain, RTOS vs Bare-metal", "status": "completed" },
			{ "id": 2, "label": "HAL & Low-Level Drivers", "subtext": "GPIO, I2C, SPI, UART, Clock config", "status": "completed" },
			{ "id": 3, "label": "Middleware Integration", "subtext": "BLE/Wi-Fi stacks, File systems", "status": "completed" },
			{ "id": 4, "label": "General Purpose Board Testing", "subtext": "Testing All IO Interface in GPP", "status": "completed" },
			{ "id": 5, "label": "Application Logic", "subtext": "State machines, business logic", "status": "current" },
			{ "id": 6, "label": "Hardware-in-the-Loop (HIL) Testing", "subtext": "Testing on target EVT boards", "status": "current" },
			{ "id": 7, "label": "Power Optimization", "subtext": "Sleep modes & current profiling", "status": "pending" },
			{ "id": 8, "label": "Bootloader & OTA Security", "subtext": "Encryption, firmware updates", "status": "pending" },
			{ "id": 9, "label": "Golden Image Production", "subtext": "Flashing binaries at factory", "status": "pending" }
		]
	},
	{
		"projectName": "Jatka Machine - 12v Convertor - PCB Generation",
		"steps": [
			{ "id": 1, "label": "Requirements & Component Selection", "subtext": "Define BOM & SoC specs", "status": "current" },
			{ "id": 2, "label": "Schematic Capture", "subtext": "Circuit design & simulation", "status": "pending" },
			{ "id": 3, "label": "PCB Layout & Routing", "subtext": "Stackup, high-speed, constraints", "status": "pending" },
			{ "id": 4, "label": "DFM & Gerber Release", "subtext": "Design for Manufacturing check", "status": "pending" },
			{ "id": 5, "label": "EVT (Engineering Validation)", "subtext": "Proto run & initial bring-up", "status": "pending" },
			{ "id": 6, "label": "DVT (Design Validation)", "subtext": "Functional & reliability tests", "status": "pending" },
			{ "id": 7, "label": "PVT & Certification", "subtext": "Pilot run, CE/FCC/RoHS", "status": "pending" },
			{ "id": 8, "label": "Mass Production & Shipping", "subtext": "Panelization & factory EOL", "status": "pending" }
		]
	},
	{
		"projectName": "Jatka Machine - Iot Switch (Esp32) - Firmware",
		"steps": [
			{ "id": 1, "label": "Architecture & Environment Setup", "subtext": "Toolchain, RTOS vs Bare-metal", "status": "pending" },
			{ "id": 2, "label": "HAL & Low-Level Drivers", "subtext": "GPIO, I2C, SPI, UART, Clock config", "status": "pending" },
			{ "id": 3, "label": "Middleware Integration", "subtext": "BLE/Wi-Fi stacks, File systems", "status": "pending" },
			{ "id": 4, "label": "General Purpose Board Testing", "subtext": "Testing All IO Interface in GPP", "status": "pending" },
			{ "id": 5, "label": "Application Logic", "subtext": "State machines, business logic", "status": "pending" },
			{ "id": 6, "label": "Hardware-in-the-Loop (HIL) Testing", "subtext": "Testing on target EVT boards", "status": "pending" },
			{ "id": 7, "label": "Power Optimization", "subtext": "Sleep modes & current profiling", "status": "pending" },
			{ "id": 8, "label": "Bootloader & OTA Security", "subtext": "Encryption, firmware updates", "status": "pending" },
			{ "id": 9, "label": "Golden Image Production", "subtext": "Flashing binaries at factory", "status": "pending" }
		]
	},
];