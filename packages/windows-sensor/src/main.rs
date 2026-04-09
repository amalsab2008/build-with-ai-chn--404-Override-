use serde::{Deserialize, Serialize};
use wmi::{COMLibrary, WMIConnection};
use std::collections::HashMap;

// WMI Event wrapper
#[derive(Deserialize, Debug)]
#[serde(rename_all = "PascalCase")]
struct ProcessEvent {
    target_instance: Win32Process,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "PascalCase")]
struct Win32Process {
    name: String,
    process_id: u32,
    parent_process_id: u32,
    command_line: Option<String>,
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let com_con = COMLibrary::new()?;
    let wmi_con = WMIConnection::new(com_con.into())?;

    eprintln!("[OS Sensor] Connected to WMI. Listening for process creation events...");

    let query = "SELECT * FROM __InstanceCreationEvent WITHIN 1 WHERE TargetInstance ISA 'Win32_Process'";
    
    // In wmi crate, we can specify the deserialization type for the iterator!
    let iterator = wmi_con.notification_query::<ProcessEvent>(&query)?;

    for result in iterator {
        if let Ok(event) = result {
             let json_out = serde_json::to_string(&event.target_instance)?;
             println!("{}", json_out);
        } else if let Err(e) = result {
             eprintln!("[OS Sensor] Error reading event: {}", e);
        }
    }
    
    Ok(())
}
