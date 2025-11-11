import React, { useState, useEffect } from "react";
import { DataReportsAPI } from "@api";
import styles from "../DataReport.module.css";

export type ReportType = "daily-monthly-active-users" | "reports-by-type" | "top-content";

export interface DataRequestOptions {
  reportType: ReportType;
  dateRange: { from: string; to: string };
  parameters: Record<string, any>;
}

interface Props {
  onSubmit: (options: DataRequestOptions) => void;
}

const DataRequestForm: React.FC<Props> = ({ onSubmit }) => {
  const [reportType, setReportType] = useState<ReportType>("daily-monthly-active-users");
  // Set default date range to last 30 days
  const [dateFrom, setDateFrom] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(() => {
    const date = new Date();
    return date.toISOString().split('T')[0];
  });
  const [parameters, setParameters] = useState<Record<string, any>>({});
  const [reportTypes, setReportTypes] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  // Fetch available report types from backend
  useEffect(() => {
    async function fetchReportTypes() {
      try {
        const result = await DataReportsAPI.getReportTypes();
        if (result.success) {
          setReportTypes(result.data);
          // Initialize parameters with default values
          initializeDefaultParameters("daily-monthly-active-users", result.data);
        }
      } catch (error) {
        console.error("Failed to fetch report types:", error);
        // Fallback to hardcoded report types
        const fallbackReportTypes = {
          "daily-monthly-active-users": {
            name: "Active Users",
            description: "User engagement analytics",
            parameters: []
          },
          "reports-by-type": {
            name: "Content Reports",
            description: "Moderation and safety insights",
            parameters: []
          },
          "top-content": {
            name: "Top Content",
            description: "Most popular content analytics",
            parameters: []
          }
        };
        setReportTypes(fallbackReportTypes);
      } finally {
        setLoading(false);
      }
    }
    
    fetchReportTypes();
  }, []);

  const initializeDefaultParameters = (type: ReportType, reportTypesData: Record<string, any>) => {
    const reportTypeConfig = reportTypesData[type];
    if (!reportTypeConfig?.parameters) return;

    const defaultParams: Record<string, any> = {};
    reportTypeConfig.parameters.forEach((param: any) => {
      if (param.default !== undefined) {
        defaultParams[param.name] = param.default;
      }
    });
    setParameters(defaultParams);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!reportType || !dateFrom || !dateTo) {
      alert("Please fill in all required fields: Report Type, From Date, and To Date");
      return;
    }
    
    // Validate result limit for top-content reports
    if (reportType === 'top-content' && parameters?.limit && parameters.limit > 50) {
      alert("Results Limit cannot exceed 50. Please enter a value between 1 and 50.");
      return;
    }
    
    // Debug: Log the data being sent
    const reportData = {
      reportType,
      dateRange: { from: dateFrom, to: dateTo },
      parameters,
    };
    
    console.log("Submitting report data:", reportData);
    
    onSubmit(reportData);
  };

  const handleParameterChange = (key: string, value: any) => {
    setParameters(prev => {
      const newParams = { ...prev, [key]: value };
      
      // Special handling: if contentType changes and current sortBy is "genre", 
      // reset sortBy to "streams" when contentType is not "songs"
      if (key === 'contentType' && reportType === 'top-content') {
        if (value !== 'songs' && prev.sortBy === 'genre') {
          newParams.sortBy = 'streams';
        }
      }
      
      return newParams;
    });
  };

  // Reset parameters when report type changes
  const handleReportTypeChange = (newReportType: ReportType) => {
    setReportType(newReportType);
    initializeDefaultParameters(newReportType, reportTypes);
  };

  if (loading) {
    return <div>Loading report ...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.row}>
        <label>
          Report Type:
          <select value={reportType} onChange={(e) => handleReportTypeChange(e.target.value as ReportType)}>
            {Object.entries(reportTypes).map(([key, reportTypeData]: [string, any]) => (
              <option key={key} value={key}>
                {reportTypeData.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          From:
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </label>

        <label>
          To:
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </label>

        {/* Dynamic parameters based on report type */}
        {reportType && reportTypes[reportType]?.parameters && (
          <div className={styles.parametersSection}>
            <h4>Parameters for {reportTypes[reportType].name}:</h4>
            <p>{reportTypes[reportType].description}</p>
            {renderDynamicParameters(reportTypes[reportType].parameters, parameters, handleParameterChange)}
          </div>
        )}

        <button 
          type="submit" 
          className={styles.submitButton} 
          disabled={!reportType || !dateFrom || !dateTo || loading}
        >
          Generate Report
        </button>
      </div>
    </form>
  );

  // Helper function to render dynamic parameters from backend configuration
  function renderDynamicParameters(
    parameterConfigs: any[], 
    params: Record<string, any>, 
    onChange: (key: string, value: any) => void
  ) {
    return parameterConfigs.map((paramConfig: any) => {
      const { name, type, label, options, default: defaultValue, min, max, placeholder, required } = paramConfig;
      
      switch (type) {
        case 'select':
          // Special handling for sortBy parameter in top-content reports
          let selectOptions = options;
          if (name === 'sortBy' && reportType === 'top-content') {
            // Only show genre option when contentType is "songs"
            const currentContentType = params['contentType'];
            selectOptions = options?.filter((option: any) => {
              if (option.value === 'genre') {
                return currentContentType === 'songs';
              }
              return true;
            });
          }
          
          return (
            <label key={name}>
              {label} {required && <span style={{ color: 'red' }}>*</span>}:
              <select 
                value={params[name] || defaultValue || ""} 
                onChange={(e) => onChange(name, e.target.value)}
                required={required}
              >
                {!required && <option value="">Select </option>}
                {selectOptions?.map((option: any) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          );
        
        case 'multiselect':
          return (
            <div key={name}>
              <label>
                {label} {required && <span style={{ color: 'red' }}>*</span>}:
              </label>
              <div style={{ marginLeft: '10px', marginTop: '5px' }}>
                {options?.map((option: any) => (
                  <label key={option.value} style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                    <input
                      type="checkbox"
                      checked={(params[name] || []).includes(option.value)}
                      onChange={(e) => {
                        const currentValues = params[name] || [];
                        let newValues;
                        if (e.target.checked) {
                          // Add the value if checked
                          newValues = [...currentValues, option.value];
                        } else {
                          // Remove the value if unchecked
                          newValues = currentValues.filter((val: string) => val !== option.value);
                        }
                        onChange(name, newValues);
                      }}
                      style={{ marginRight: '8px' }}
                    />
                    {option.label}
                  </label>
                ))}
                <small style={{ color: '#666', fontStyle: 'italic' }}>
                  Select multiple options by checking the boxes. Leave all unchecked for "All Types".
                </small>
              </div>
            </div>
          );
        
        case 'number':
          return (
            <label key={name}>
              {label} {required && <span style={{ color: 'red' }}>*</span>}:
              <input 
                type="number" 
                value={params[name] || defaultValue || ""} 
                onChange={(e) => onChange(name, parseInt(e.target.value) || 0)}
                min={min}
                max={max}
                required={required}
              />
            </label>
          );
        
        case 'text':
          return (
            <label key={name}>
              {label} {required && <span style={{ color: 'red' }}>*</span>}:
              <input 
                type="text" 
                value={params[name] || defaultValue || ""} 
                onChange={(e) => onChange(name, e.target.value)}
                placeholder={placeholder}
                required={required}
              />
            </label>
          );
        
        case 'checkbox':
          return (
            <label key={name}>
              <input 
                type="checkbox" 
                checked={params[name] ?? defaultValue ?? false} 
                onChange={(e) => onChange(name, e.target.checked)}
              />
              {label}
            </label>
          );
        
        default:
          return null;
      }
    });
  }
};

export default DataRequestForm;