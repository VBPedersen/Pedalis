// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use midir::{MidiOutput, MidiOutputConnection};
use std::sync::{Arc, Mutex};
use tauri::{Emitter, State};

// ─── Shared State ────────────────────────────────────────────────────────────

struct MidiState(Arc<Mutex<Option<MidiOutputConnection>>>);

// ─── Tauri Commands ──────────────────────────────────────────────────────────

/// List available MIDI output port names so the frontend can let the user pick.
#[tauri::command]
fn list_midi_ports() -> Result<Vec<String>, String> {
    let midi_out = MidiOutput::new("Pedalis").map_err(|e| e.to_string())?;
    let ports = midi_out.ports();
    let names: Vec<String> = ports
        .iter()
        .filter_map(|p| midi_out.port_name(p).ok())
        .collect();
    Ok(names)
}

/// Connect to a MIDI output port by name.
#[tauri::command]
fn connect_midi_port(port_name: String, state: State<MidiState>) -> Result<(), String> {
    let midi_out = MidiOutput::new("Pedalis").map_err(|e| e.to_string())?;
    let ports = midi_out.ports();

    let target = ports
        .iter()
        .find(|p| midi_out.port_name(p).unwrap_or_default() == port_name)
        .ok_or_else(|| format!("MIDI port '{}' not found", port_name))?;

    let conn = midi_out
        .connect(target, "pedalis-out")
        .map_err(|e| e.to_string())?;

    let mut guard = state.0.lock().unwrap();
    *guard = Some(conn);
    Ok(())
}

/// Send a MIDI Control Change message.
/// channel: 0-15, cc: 0-127, value: 0-127
#[tauri::command]
fn send_midi_cc(channel: u8, cc: u8, value: u8, state: State<MidiState>) -> Result<(), String> {
    let mut guard = state.0.lock().unwrap();
    if let Some(conn) = guard.as_mut() {
        // Status byte: 0xB0 | channel  (Control Change)
        let status = 0xB0 | (channel & 0x0F);
        conn.send(&[status, cc & 0x7F, value & 0x7F])
            .map_err(|e| e.to_string())?;
        Ok(())
    } else {
        Err("No MIDI port connected".to_string())
    }
}

/// Send a MIDI Program Change message.
#[tauri::command]
fn send_midi_pc(channel: u8, program: u8, state: State<MidiState>) -> Result<(), String> {
    let mut guard = state.0.lock().unwrap();
    if let Some(conn) = guard.as_mut() {
        let status = 0xC0 | (channel & 0x0F);
        conn.send(&[status, program & 0x7F])
            .map_err(|e| e.to_string())?;
        Ok(())
    } else {
        Err("No MIDI port connected".to_string())
    }
}

/// List available serial ports (for the hardware foot controller).
#[tauri::command]
fn list_serial_ports() -> Result<Vec<String>, String> {
    let ports = serialport::available_ports().map_err(|e| e.to_string())?;
    Ok(ports.into_iter().map(|p| p.port_name).collect())
}

// ─── Serial Listener Thread ───────────────────────────────────────────────────

/// Spawn a background thread that reads the hardware serial stream and emits
/// Tauri events to the frontend.
///   "hardware-stomp"  → payload: switch number (u8)
///   "hardware-exp"    → payload: raw ADC value (u16), already mapped 0-127
fn start_serial_listener(app_handle: tauri::AppHandle, port_name: String, baud: u32) {
    std::thread::spawn(move || {
        let port = serialport::new(&port_name, baud)
            .timeout(std::time::Duration::from_millis(500))
            .open();

        match port {
            Err(e) => {
                eprintln!("[Serial] Could not open {}: {}", port_name, e);
            }
            Ok(mut port) => {
                eprintln!("[Serial] Listening on {}", port_name);
                let mut buf = Vec::new();
                let mut byte = [0u8; 1];

                loop {
                    match port.read(&mut byte) {
                        Ok(1) => {
                            if byte[0] == b'\n' {
                                let line = String::from_utf8_lossy(&buf).trim().to_string();
                                handle_serial_line(&app_handle, &line);
                                buf.clear();
                            } else {
                                buf.push(byte[0]);
                            }
                        }
                        Ok(_) => {}
                        Err(ref e) if e.kind() == std::io::ErrorKind::TimedOut => {}
                        Err(e) => {
                            eprintln!("[Serial] Read error: {}", e);
                            break;
                        }
                    }
                }
            }
        }
    });
}

fn handle_serial_line(app: &tauri::AppHandle, line: &str) {
    // Protocol: "SW:1"  or  "EXP:2048"
    if let Some(rest) = line.strip_prefix("SW:") {
        if let Ok(switch_num) = rest.trim().parse::<u8>() {
            let _ = app.emit("hardware-stomp", switch_num);
        }
    } else if let Some(rest) = line.strip_prefix("EXP:") {
        if let Ok(raw) = rest.trim().parse::<u16>() {
            // Map 0-4095 (12-bit ADC) → 0-127 (MIDI CC)
            let midi_val = (raw as u32 * 127 / 4095) as u8;
            let _ = app.emit("hardware-exp", midi_val);
        }
    }
}

/// Tauri command to kick off the serial listener from the frontend.
#[tauri::command]
fn connect_serial_port(
    port_name: String,
    baud_rate: u32,
    app_handle: tauri::AppHandle,
) -> Result<(), String> {
    start_serial_listener(app_handle, port_name, baud_rate);
    Ok(())
}

// ─── Main ─────────────────────────────────────────────────────────────────────

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .manage(MidiState(Arc::new(Mutex::new(None))))
        .invoke_handler(tauri::generate_handler![
            list_midi_ports,
            connect_midi_port,
            send_midi_cc,
            send_midi_pc,
            list_serial_ports,
            connect_serial_port,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Pedalis");
}

