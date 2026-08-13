"""
RF Physical Layer — CC1101 & SX1262 Transceiver Configs

Encodes the full RF physical layer and routing metadata
for commanding the physical world (NullSec LoRa Mesh,
Flipper Zero, technician swarm).

Each Interaction Quantum carries its own RF context,
allowing deterministic signal reconstruction at any node.
"""

from dataclasses import dataclass, field, asdict
from enum import Enum
from typing import Optional


class Transceiver(str, Enum):
    CC1101 = "CC1101"
    SX1262 = "SX1262"
    SX1276 = "SX1276"
    NRF24L01 = "NRF24L01"
    VIRTUAL = "virtual"  # Software-defined


class Modulation(str, Enum):
    CSS = "CSS"       # Chirp Spread Spectrum (LoRa)
    FSK = "FSK"       # Frequency Shift Keying
    LORA = "LoRa"     # LoRa modulation
    GFSK = "GFSK"     # Gaussian FSK
    OOK = "OOK"       # On-Off Keying
    MSK = "MSK"       # Minimum Shift Keying


class RegionalPlan(str, Enum):
    US915 = "US915"
    EU868 = "EU868"
    AU915 = "AU915"
    AS923 = "AS923"
    IN865 = "IN865"
    KR920 = "KR920"
    ISM2400 = "ISM2400"  # 2.4 GHz


# ─── CC1101 Configuration ────────────────────────────────────────────

@dataclass
class CC1101Config:
    """
    TI CC1101 sub-GHz transceiver configuration.
    
    Capabilities:
    - Frequency: 300-348 MHz, 387-464 MHz, 779-928 MHz
    - Modulation: FSK, GFSK, ASK/OOK, MSK
    - Data rate: up to 500 kbps
    - Sensitivity: -116 dBm at 1.2 kbps
    - TX power: up to +12 dBm
    """
    transceiver: str = "CC1101"
    frequency_hz: int = 915000000
    modulation: str = "GFSK"
    bandwidth_hz: int = 125000
    data_rate_bps: int = 250000
    tx_power_dbm: int = 12
    rx_sensitivity_dbm: int = -116
    deviation_hz: int = 50000
    sync_word: bytes = b"\xAA\x55"
    packet_length: int = 64
    crc_enabled: bool = True
    whitening: bool = True
    pa_table: list[int] = field(default_factory=lambda: [0x00, 0xC0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00])

    def to_dict(self) -> dict:
        d = asdict(self)
        d["sync_word"] = self.sync_word.hex()
        return d


# ─── SX1262 Configuration ────────────────────────────────────────────

@dataclass
class SX1262Config:
    """
    Semtech SX1262 LoRa transceiver configuration.
    
    Capabilities:
    - Frequency: 150-960 MHz
    - LoRa & FSK modulation
    - Sensitivity: -148 dBm (LoRa SF12)
    - TX power: up to +22 dBm
    - Spreading factor: SF5-SF12
    - Low power: 4.2 mA RX, 120 mA TX at +22 dBm
    """
    transceiver: str = "SX1262"
    frequency_hz: int = 915000000
    modulation: str = "LoRa"
    bandwidth_hz: int = 125000
    spreading_factor: int = 7          # SF7-SF12
    coding_rate: str = "4/5"           # 4/5, 4/6, 4/7, 4/8
    tx_power_dbm: int = 22
    rx_sensitivity_dbm: int = -137     # SF7 at 125 kHz
    crc_enabled: bool = True
    implicit_header: bool = False
    low_data_rate_optimize: bool = False
    preamble_length: int = 8
    sync_word: int = 0x1424            # LoRaWAN public
    iq_inverted: bool = False

    @property
    def data_rate_bps(self) -> int:
        """Calculate effective data rate based on SF and BW."""
        # LoRa bit rate = SF * (BW / 2^SF) * (4/CR)
        cr_map = {"4/5": 5, "4/6": 6, "4/7": 7, "4/8": 8}
        cr = cr_map.get(self.coding_rate, 5)
        sf = self.spreading_factor
        bw = self.bandwidth_hz
        return int(sf * (bw / (2 ** sf)) * (4 / cr))

    @property
    def time_on_air_ms(self, payload_bytes: int = 64) -> float:
        """Estimate time on air for a payload."""
        # Simplified ToA calculation
        de = 1 if self.low_data_rate_optimize else 0
        cr_val = int(self.coding_rate.split("/")[1]) - 4
        sf = self.spreading_factor
        bw = self.bandwidth_hz

        numerator = 8 * payload_bytes - 4 * sf + 28 + 16 * (1 if self.crc_enabled else 0) - (0 if self.implicit_header else 20)
        denominator = 4 * (sf - 2 * de)
        symbols = 8 + max(0, numerator / denominator) * (cr_val + 4)
        
        return (2 ** sf / bw) * symbols * 1000  # ms

    def to_dict(self) -> dict:
        d = {
            "transceiver": self.transceiver,
            "frequency_hz": self.frequency_hz,
            "modulation": self.modulation,
            "bandwidth_hz": self.bandwidth_hz,
            "spreading_factor": self.spreading_factor,
            "coding_rate": self.coding_rate,
            "tx_power_dbm": self.tx_power_dbm,
            "rx_sensitivity_dbm": self.rx_sensitivity_dbm,
            "crc_enabled": self.crc_enabled,
            "preamble_length": self.preamble_length,
            "sync_word": hex(self.sync_word),
            "data_rate_bps": self.data_rate_bps,
        }
        return d


# ─── RF Physical Layer ───────────────────────────────────────────────

class RFPhysicalLayer:
    """
    Unified RF physical layer manager.
    
    Handles transceiver selection, power management, and
    signal metadata extraction for Interaction Quanta.
    """

    def __init__(self, config=None):
        if config is None:
            config = SX1262Config()
        self.config = config
        self.stats = {
            "tx_count": 0,
            "rx_count": 0,
            "bytes_tx": 0,
            "bytes_rx": 0,
            "last_rssi": -120.0,
            "last_snr": 0.0,
        }

    def build_rf_metadata(self) -> dict:
        """Build RF metadata dict for embedding in an Interaction Quantum."""
        return self.config.to_dict()

    def power_for_urgency(self, urgency: float) -> int:
        """
        Map cognitive urgency (0.0-1.0) to TX power level.
        
        Higher urgency → higher power for reliable delivery.
        Low urgency → lower power for battery conservation.
        """
        if hasattr(self.config, "tx_power_dbm"):
            max_power = self.config.tx_power_dbm
        else:
            max_power = 22

        # Scale: 0.0 urgency → 50% power, 1.0 → 100% power
        min_power = max_power * 0.5
        return int(min_power + (max_power - min_power) * urgency)

    def spreading_factor_for_range(self, range_km: float) -> int:
        """
        Select spreading factor based on desired range.
        
        Higher SF = longer range but slower data rate.
        SF7: ~2km, SF9: ~5km, SF12: ~15km (line of sight)
        """
        if isinstance(self.config, SX1262Config):
            if range_km <= 2:
                return 7
            elif range_km <= 5:
                return 9
            elif range_km <= 10:
                return 10
            else:
                return 12
        return 7  # Default for non-LoRa

    def estimate_range(self, rssi_dbm: float) -> float:
        """
        Estimate communication range from RSSI.
        
        Uses simplified free-space path loss model.
        """
        # FSPL: RSSI = Tx_power - 20*log10(d) - 20*log10(f) + 147.55
        tx_power = getattr(self.config, "tx_power_dbm", 22)
        freq_mhz = getattr(self.config, "frequency_hz", 915000000) / 1e6
        
        if rssi_dbm >= tx_power:
            return 0.01  # Very close
        
        # d = 10^((Tx - RSSI - 147.55 + 20*log10(f)) / 20)
        path_loss = tx_power - rssi_dbm
        distance_m = 10 ** ((path_loss - 147.55 + 20 * math.log10(freq_mhz)) / 20)
        return distance_m / 1000  # Convert to km

    def __repr__(self) -> str:
        return f"RFPhysicalLayer(transceiver={self.config.transceiver}, freq={self.config.frequency_hz/1e6:.1f}MHz)"


# Need math for estimate_range
import math
