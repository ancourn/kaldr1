//! Solidity Compiler Integration for KALDRIX EVM
//! 
//! This module provides integration with the Solidity compiler
//! to enable smart contract compilation and deployment on KALDRIX blockchain.

use std::path::{Path, PathBuf};
use std::process::Command;
use serde::{Deserialize, Serialize};
use thiserror::Error;

/// Solidity Compiler Integration
/// 
/// Provides compilation services for Solidity smart contracts
/// with integration to the KALDRIX EVM implementation.
pub struct SolidityCompiler {
    /// Compiler version
    version: String,
    /// Compiler path
    compiler_path: PathBuf,
    /// Compilation options
    options: CompilationOptions,
    /// Output formatter
    output_formatter: Box<dyn OutputFormatter>,
}

/// Compilation options for Solidity compiler
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompilationOptions {
    /// Optimization enabled
    pub optimize: bool,
    /// Optimization runs
    pub optimize_runs: u32,
    /// Target EVM version
    pub evm_version: EvmVersion,
    /// Libraries to link
    pub libraries: Vec<LibraryLink>,
    /// Output selection
    pub output_selection: OutputSelection,
}

/// EVM version compatibility
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum EvmVersion {
    /// Homestead
    Homestead,
    /// Tangerine Whistle
    TangerineWhistle,
    /// Spurious Dragon
    SpuriousDragon,
    /// Byzantium
    Byzantium,
    /// Constantinople
    Constantinople,
    /// Petersburg
    Petersburg,
    /// Istanbul
    Istanbul,
    /// Berlin
    Berlin,
    /// London
    London,
    /// Paris
    Paris,
    /// Shanghai
    Shanghai,
    /// Cancun
    Cancun,
}

/// Library linking information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LibraryLink {
    /// Library name
    pub name: String,
    /// Library address
    pub address: String,
}

/// Output selection configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OutputSelection {
    /// Include ABI output
    pub abi: bool,
    /// Include bytecode output
    pub bytecode: bool,
    /// Include deployed bytecode output
    pub deployed_bytecode: bool,
    /// Include method identifiers
    pub method_identifiers: bool,
    /// Include gas estimates
    pub gas_estimates: bool,
    /// Include metadata
    pub metadata: bool,
}

/// Compilation output
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompilationOutput {
    /// Compiler version
    pub compiler_version: String,
    /// Contracts compiled
    pub contracts: Vec<ContractOutput>,
    /// Errors encountered
    pub errors: Vec<CompilationError>,
    /// Warnings encountered
    pub warnings: Vec<CompilationWarning>,
}

/// Individual contract output
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContractOutput {
    /// Contract name
    pub name: String,
    /// Contract ABI
    pub abi: Option<Vec<AbiEntry>>,
    /// Contract bytecode
    pub bytecode: Option<String>,
    /// Deployed bytecode
    pub deployed_bytecode: Option<String>,
    /// Method identifiers
    pub method_identifiers: Option<std::collections::HashMap<String, String>>,
    /// Gas estimates
    pub gas_estimates: Option<GasEstimates>,
    /// Metadata
    pub metadata: Option<serde_json::Value>,
}

/// ABI entry
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AbiEntry {
    /// Entry type
    #[serde(rename = "type")]
    pub entry_type: String,
    /// Entry name
    pub name: Option<String>,
    /// Input parameters
    pub inputs: Vec<Parameter>,
    /// Output parameters
    pub outputs: Vec<Parameter>,
    /// State mutability
    pub state_mutability: Option<String>,
}

/// Function parameter
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Parameter {
    /// Parameter name
    pub name: String,
    /// Parameter type
    #[serde(rename = "type")]
    pub param_type: String,
    /// Components (for struct types)
    pub components: Option<Vec<Parameter>>,
}

/// Gas estimates
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GasEstimates {
    /// Creation gas cost
    pub creation: Option<CreationGasCost>,
    /// External function gas costs
    pub external: Option<std::collections::HashMap<String, u64>>,
    /// Internal function gas costs
    pub internal: Option<std::collections::HashMap<String, u64>>,
}

/// Creation gas cost
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreationGasCost {
    /// Code deposit cost
    pub code_deposit_cost: u64,
    /// Execution cost
    pub execution_cost: u64,
    /// Total cost
    pub total_cost: u64,
}

/// Compilation error
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompilationError {
    /// Error type
    #[serde(rename = "type")]
    pub error_type: String,
    /// Error component
    pub component: String,
    /// Error severity
    pub severity: String,
    /// Error message
    pub message: String,
    /// Source location
    pub source_location: Option<SourceLocation>,
}

/// Compilation warning
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompilationWarning {
    /// Warning type
    #[serde(rename = "type")]
    pub warning_type: String,
    /// Warning component
    pub component: String,
    /// Warning severity
    pub severity: String,
    /// Warning message
    pub message: String,
    /// Source location
    pub source_location: Option<SourceLocation>,
}

/// Source location in source code
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SourceLocation {
    /// File path
    pub file: String,
    /// Start line
    pub start: u32,
    /// End line
    pub end: u32,
}

/// Output formatter for compilation results
pub trait OutputFormatter: Send + Sync {
    /// Format compilation output
    fn format_output(&self, output: CompilationOutput) -> Result<String, FormatterError>;
    /// Format error output
    fn format_error(&self, error: &CompilationError) -> String;
    /// Format warning output
    fn format_warning(&self, warning: &CompilationWarning) -> String;
}

/// Solidity compiler errors
#[derive(Error, Debug)]
pub enum SolidityError {
    #[error("Compiler not found: {0}")]
    CompilerNotFound(String),
    #[error("Compilation failed: {0}")]
    CompilationFailed(String),
    #[error("Invalid source file: {0}")]
    InvalidSourceFile(String),
    #[error("Output parsing failed: {0}")]
    OutputParsingFailed(String),
    #[error("Configuration error: {0}")]
    ConfigurationError(String),
}

/// Output formatter errors
#[derive(Error, Debug)]
pub enum FormatterError {
    #[error("Formatting failed: {0}")]
    FormattingFailed(String),
    #[error("Serialization error: {0}")]
    SerializationError(String),
}

impl SolidityCompiler {
    /// Create a new Solidity compiler instance
    pub fn new(compiler_path: PathBuf, options: CompilationOptions) -> Result<Self, SolidityError> {
        // Validate compiler path
        if !compiler_path.exists() {
            return Err(SolidityError::CompilerNotFound(
                format!("Compiler not found at: {:?}", compiler_path)
            ));
        }

        // Get compiler version
        let version = Self::get_compiler_version(&compiler_path)?;

        Ok(Self {
            version,
            compiler_path,
            options,
            output_formatter: Box::new(JsonOutputFormatter),
        })
    }

    /// Get compiler version
    fn get_compiler_version(compiler_path: &Path) -> Result<String, SolidityError> {
        let output = Command::new(compiler_path)
            .arg("--version")
            .output()
            .map_err(|e| SolidityError::CompilationFailed(
                format!("Failed to get compiler version: {}", e)
            ))?;

        if !output.status.success() {
            return Err(SolidityError::CompilationFailed(
                format!("Compiler version check failed: {}", String::from_utf8_lossy(&output.stderr))
            ));
        }

        let version_output = String::from_utf8_lossy(&output.stdout);
        Ok(version_output.trim().to_string())
    }

    /// Compile Solidity source files
    pub fn compile(&self, source_files: Vec<PathBuf>) -> Result<CompilationOutput, SolidityError> {
        // Validate source files
        for file in &source_files {
            if !file.exists() {
                return Err(SolidityError::InvalidSourceFile(
                    format!("Source file not found: {:?}", file)
                ));
            }
        }

        // Prepare compiler command
        let mut cmd = Command::new(&self.compiler_path);

        // Add standard output selection
        cmd.arg("--combined-json")
           .arg("abi,bytecode,deployedBytecode,methodIdentifiers,gasEstimates,metadata");

        // Add optimization options if enabled
        if self.options.optimize {
            cmd.arg("--optimize");
            cmd.arg("--optimize-runs").arg(self.options.optimize_runs.to_string());
        }

        // Add EVM version
        cmd.arg("--evm-version").arg(self.evm_version_to_string());

        // Add source files
        for file in source_files {
            cmd.arg(file);
        }

        // Execute compiler
        let output = cmd.output()
            .map_err(|e| SolidityError::CompilationFailed(
                format!("Failed to execute compiler: {}", e)
            ))?;

        if !output.status.success() {
            return Err(SolidityError::CompilationFailed(
                format!("Compilation failed: {}", String::from_utf8_lossy(&output.stderr))
            ));
        }

        // Parse compiler output
        let json_output = String::from_utf8_lossy(&output.stdout);
        let compilation_output: CompilationOutput = serde_json::from_str(&json_output)
            .map_err(|e| SolidityError::OutputParsingFailed(
                format!("Failed to parse compiler output: {}", e)
            ))?;

        Ok(compilation_output)
    }

    /// Compile a single Solidity source file
    pub fn compile_file(&self, source_file: PathBuf) -> Result<CompilationOutput, SolidityError> {
        self.compile(vec![source_file])
    }

    /// Get contract bytecode for deployment
    pub fn get_contract_bytecode(&self, compilation_output: &CompilationOutput, contract_name: &str) -> Result<Vec<u8>, SolidityError> {
        let contract = compilation_output.contracts.iter()
            .find(|c| c.name == contract_name)
            .ok_or_else(|| SolidityError::CompilationFailed(
                format!("Contract '{}' not found in compilation output", contract_name)
            ))?;

        let bytecode_hex = contract.bytecode.as_ref()
            .ok_or_else(|| SolidityError::CompilationFailed(
                format!("Bytecode not available for contract '{}'", contract_name)
            ))?;

        // Remove "0x" prefix if present
        let bytecode_clean = bytecode_hex.strip_prefix("0x").unwrap_or(bytecode_hex);
        
        // Convert hex to bytes
        hex::decode(bytecode_clean)
            .map_err(|e| SolidityError::OutputParsingFailed(
                format!("Failed to decode bytecode: {}", e)
            ))
    }

    /// Get contract ABI
    pub fn get_contract_abi(&self, compilation_output: &CompilationOutput, contract_name: &str) -> Result<Vec<AbiEntry>, SolidityError> {
        let contract = compilation_output.contracts.iter()
            .find(|c| c.name == contract_name)
            .ok_or_else(|| SolidityError::CompilationFailed(
                format!("Contract '{}' not found in compilation output", contract_name)
            ))?;

        contract.abi.clone()
            .ok_or_else(|| SolidityError::CompilationFailed(
                format!("ABI not available for contract '{}'", contract_name)
            ))
    }

    /// Convert EVM version to string
    fn evm_version_to_string(&self) -> String {
        match self.options.evm_version {
            EvmVersion::Homestead => "homestead",
            EvmVersion::TangerineWhistle => "tangerineWhistle",
            EvmVersion::SpuriousDragon => "spuriousDragon",
            EvmVersion::Byzantium => "byzantium",
            EvmVersion::Constantinople => "constantinople",
            EvmVersion::Petersburg => "petersburg",
            EvmVersion::Istanbul => "istanbul",
            EvmVersion::Berlin => "berlin",
            EvmVersion::London => "london",
            EvmVersion::Paris => "paris",
            EvmVersion::Shanghai => "shanghai",
            EvmVersion::Cancun => "cancun",
        }.to_string()
    }

    /// Set compilation options
    pub fn set_options(&mut self, options: CompilationOptions) {
        self.options = options;
    }

    /// Get current compilation options
    pub fn get_options(&self) -> &CompilationOptions {
        &self.options
    }

    /// Get compiler version
    pub fn get_version(&self) -> &str {
        &self.version
    }
}

/// JSON output formatter
struct JsonOutputFormatter;

impl OutputFormatter for JsonOutputFormatter {
    fn format_output(&self, output: CompilationOutput) -> Result<String, FormatterError> {
        serde_json::to_string_pretty(&output)
            .map_err(|e| FormatterError::SerializationError(
                format!("Failed to serialize output: {}", e)
            ))
    }

    fn format_error(&self, error: &CompilationError) -> String {
        format!("ERROR [{}]: {}", error.severity, error.message)
    }

    fn format_warning(&self, warning: &CompilationWarning) -> String {
        format!("WARNING [{}]: {}", warning.severity, warning.message)
    }
}

/// Default compilation options
impl Default for CompilationOptions {
    fn default() -> Self {
        Self {
            optimize: true,
            optimize_runs: 200,
            evm_version: EvmVersion::London,
            libraries: Vec::new(),
            output_selection: OutputSelection {
                abi: true,
                bytecode: true,
                deployed_bytecode: true,
                method_identifiers: true,
                gas_estimates: true,
                metadata: false,
            },
        }
    }
}

/// Default EVM version
impl Default for EvmVersion {
    fn default() -> Self {
        EvmVersion::London
    }
}

/// Default output selection
impl Default for OutputSelection {
    fn default() -> Self {
        Self {
            abi: true,
            bytecode: true,
            deployed_bytecode: true,
            method_identifiers: true,
            gas_estimates: true,
            metadata: false,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

    #[test]
    fn test_default_compilation_options() {
        let options = CompilationOptions::default();
        assert!(options.optimize);
        assert_eq!(options.optimize_runs, 200);
        assert_eq!(options.evm_version, EvmVersion::London);
    }

    #[test]
    fn test_evm_version_to_string() {
        let compiler = SolidityCompiler {
            version: "0.8.0".to_string(),
            compiler_path: PathBuf::new(),
            options: CompilationOptions {
                evm_version: EvmVersion::London,
                ..Default::default()
            },
            output_formatter: Box::new(JsonOutputFormatter),
        };

        assert_eq!(compiler.evm_version_to_string(), "london");
    }

    #[test]
    fn test_abi_entry_serialization() {
        let abi_entry = AbiEntry {
            entry_type: "function".to_string(),
            name: Some("transfer".to_string()),
            inputs: vec![
                Parameter {
                    name: "to".to_string(),
                    param_type: "address".to_string(),
                    components: None,
                },
                Parameter {
                    name: "amount".to_string(),
                    param_type: "uint256".to_string(),
                    components: None,
                },
            ],
            outputs: vec![],
            state_mutability: Some("nonpayable".to_string()),
        };

        let json = serde_json::to_string(&abi_entry).unwrap();
        assert!(json.contains("transfer"));
        assert!(json.contains("address"));
        assert!(json.contains("uint256"));
    }
}