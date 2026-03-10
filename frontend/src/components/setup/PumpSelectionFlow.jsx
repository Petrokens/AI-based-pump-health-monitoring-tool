import React, { useState } from 'react';
import {
  PUMP_CATEGORIES,
  getTypesByCategory,
  PUMP_MASTER_FIELDS,
} from '../../data/pumpTaxonomy';
import { ChevronRight, ChevronLeft, Check, Zap, Upload, FileSpreadsheet, Edit3, FileUp } from 'lucide-react';
import { uploadPumpMaster, uploadPumpMasterFile, uploadOperationLog, uploadMaintenanceLog, createPump } from '../../services/api';

const STEP_CATEGORY = 1;
const STEP_TYPE = 2;
const STEP_DATA = 3;
const STEP_OPERATION_LOG = 4;
const STEP_MAINTENANCE_LOG = 5;

const STEPS = [STEP_CATEGORY, STEP_TYPE, STEP_DATA, STEP_OPERATION_LOG, STEP_MAINTENANCE_LOG];

const FREE_PLAN_MAX_PUMPS = 2;

export default function PumpSelectionFlow({ onSubmit, clientId, pumpsCount = 0 }) {
  const [step, setStep] = useState(STEP_CATEGORY);
  const [categoryId, setCategoryId] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [formData, setFormData] = useState({});
  const [operationLogFile, setOperationLogFile] = useState(null);
  const [maintenanceLogFile, setMaintenanceLogFile] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [masterInputMode, setMasterInputMode] = useState('enter'); // 'enter' | 'upload'
  const [masterDataFromUpload, setMasterDataFromUpload] = useState(false);
  const [masterFile, setMasterFile] = useState(null);
  const [masterUploading, setMasterUploading] = useState(false);

  const types = categoryId ? getTypesByCategory(categoryId) : [];
  const category = PUMP_CATEGORIES.find((c) => c.id === categoryId);

  const handleCategorySelect = (id) => {
    setCategoryId(id);
    setSelectedType(null);
    setFormData({});
    setStep(STEP_TYPE);
  };

  const handleTypeSelect = (typeRow) => {
    setSelectedType(typeRow);
    setFormData((prev) => ({
      ...prev,
      pump_type: typeRow.pumpType,
      pump_type_detail: typeRow.subType,
      standard: typeRow.standard,
    }));
    setStep(STEP_DATA);
  };

  const updateFormField = (fieldId, value) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleMasterFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError('');
    setMasterUploading(true);
    try {
      const res = await uploadPumpMasterFile(file);
      const row = res.row || {};
      const normalized = {};
      PUMP_MASTER_FIELDS.forEach((f) => {
        let v = row[f.id];
        if (v == null) { normalized[f.id] = ''; return; }
        if (f.type === 'number') v = typeof v === 'number' ? v : Number(v);
        if (f.type === 'date') {
          if (typeof v === 'string') v = v.slice(0, 10);
          else if (v && typeof v.toISOString === 'function') v = v.toISOString().slice(0, 10);
        }
        normalized[f.id] = v ?? '';
      });
      setFormData((prev) => ({ ...prev, ...normalized }));
      setMasterDataFromUpload(true);
      setMasterFile(file);
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message || err.message || 'Upload failed';
      setUploadError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setMasterUploading(false);
    }
  };

  const handleNextFromData = () => {
    setUploadError('');
    setStep(STEP_OPERATION_LOG);
  };

  const switchMasterMode = (mode) => {
    setMasterInputMode(mode);
    setUploadError('');
    if (mode === 'enter') {
      setMasterDataFromUpload(false);
      setMasterFile(null);
    }
  };

  const handleNextFromOperationLog = () => {
    setUploadError('');
    setStep(STEP_MAINTENANCE_LOG);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploadError('');
    if (clientId && pumpsCount >= FREE_PLAN_MAX_PUMPS) {
      setUploadError(`Free plan allows only ${FREE_PLAN_MAX_PUMPS} pump(s). Upgrade to add more.`);
      return;
    }
    setUploading(true);
    try {
      const payload = {
        categoryId,
        categoryLabel: category?.label,
        pumpType: selectedType?.pumpType,
        subType: selectedType?.subType,
        standard: selectedType?.standard,
        ...formData,
      };
      if (!masterDataFromUpload) await uploadPumpMaster(payload);
      if (operationLogFile) await uploadOperationLog(operationLogFile);
      if (maintenanceLogFile) await uploadMaintenanceLog(maintenanceLogFile);
      if (clientId) {
        const created = await createPump(payload, clientId);
        onSubmit(created);
      } else {
        onSubmit(payload);
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Upload failed';
      setUploadError(msg);
    } finally {
      setUploading(false);
    }
  };

  const goBack = () => {
    setUploadError('');
    if (step === STEP_TYPE) {
      setStep(STEP_CATEGORY);
      setCategoryId(null);
      setSelectedType(null);
    } else if (step === STEP_DATA) {
      setStep(STEP_TYPE);
      setSelectedType(null);
    } else if (step === STEP_OPERATION_LOG) {
      setStep(STEP_DATA);
    } else if (step === STEP_MAINTENANCE_LOG) {
      setStep(STEP_OPERATION_LOG);
    }
  };

  const canOpenDashboard = formData.pump_id && operationLogFile && maintenanceLogFile;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress */}
      <div className="flex items-center justify-center gap-1 sm:gap-2 mb-8 flex-wrap">
        {STEPS.map((s, i) => (
          <React.Fragment key={s}>
            <div
              className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold ${
                step >= s
                  ? 'bg-primary-500 text-white'
                  : 'bg-[var(--bg-secondary)] text-[var(--text-tertiary)]'
              }`}
            >
              {step > s ? <Check className="w-4 h-4 sm:w-5 sm:h-5" /> : s}
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`w-4 sm:w-8 h-0.5 ${step > s ? 'bg-primary-500' : 'bg-[var(--border-color)]'}`}
              />
            )}
          </React.Fragment>
        ))}
      </div>
      <p className="text-center text-[var(--text-secondary)] text-sm mb-6">
        {step === STEP_CATEGORY && 'Select pump category'}
        {step === STEP_TYPE && 'Select pump type and design standard'}
        {step === STEP_DATA && 'Enter all pump master data (pump_master.csv fields)'}
        {step === STEP_OPERATION_LOG && 'Upload operation log (Excel or CSV)'}
        {step === STEP_MAINTENANCE_LOG && 'Upload maintenance log (Excel or CSV). Then open dashboard.'}
      </p>

      {/* Step 1: Category */}
      {step === STEP_CATEGORY && (
        <div className="grid sm:grid-cols-2 gap-4">
          {PUMP_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleCategorySelect(cat.id)}
              className="p-6 rounded-2xl border-2 border-[var(--border-color)] bg-[var(--bg-card)] text-left hover:border-primary-500 hover:bg-[var(--bg-card-hover)] transition-all"
            >
              <div className="font-bold text-[var(--text-primary)] mb-1">{cat.label}</div>
              <div className="text-sm text-[var(--text-secondary)]">{cat.description}</div>
              <ChevronRight className="w-5 h-5 text-primary-500 mt-2 ml-auto" />
            </button>
          ))}
        </div>
      )}

      {/* Step 2: Type */}
      {step === STEP_TYPE && (
        <div className="space-y-4">
          <button
            type="button"
            onClick={goBack}
            className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm"
          >
            <ChevronLeft className="w-4 h-4" /> Back to category
          </button>
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl overflow-hidden">
            <div className="grid grid-cols-3 gap-2 p-3 bg-[var(--bg-secondary)] text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
              <div>Pump Type</div>
              <div>Sub Type</div>
              <div>Design Standard</div>
            </div>
            {types.map((row, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleTypeSelect(row)}
                className="w-full grid grid-cols-3 gap-2 p-4 text-left border-b border-[var(--border-color)] last:border-0 hover:bg-[var(--bg-card-hover)] transition-colors"
              >
                <span className="font-medium text-[var(--text-primary)]">{row.pumpType}</span>
                <span className="text-[var(--text-secondary)]">{row.subType}</span>
                <span className="text-sm text-[var(--text-tertiary)]">{row.standard}</span>
                <ChevronRight className="w-4 h-4 text-primary-500 col-span-3 mt-1" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Pump master – Enter or Upload, then form/upload below */}
      {step === STEP_DATA && (
        <div className="space-y-6">
          <button
            type="button"
            onClick={goBack}
            className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm"
          >
            <ChevronLeft className="w-4 h-4" /> Back to type selection
          </button>

          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6">
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">
              Selected: {selectedType?.pumpType} – {selectedType?.subType}
            </h3>
            <p className="text-sm text-[var(--text-secondary)] mb-4">
              Standard: {selectedType?.standard}
            </p>

            {/* Two options: Enter manually | Upload file */}
            <div className="flex gap-2 mb-6">
              <button
                type="button"
                onClick={() => switchMasterMode('enter')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-colors ${
                  masterInputMode === 'enter'
                    ? 'border-primary-500 bg-primary-500/10 text-primary-400'
                    : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--text-tertiary)]'
                }`}
              >
                <Edit3 className="w-4 h-4" />
                Enter manually
              </button>
              <button
                type="button"
                onClick={() => switchMasterMode('upload')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-colors ${
                  masterInputMode === 'upload'
                    ? 'border-primary-500 bg-primary-500/10 text-primary-400'
                    : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--text-tertiary)]'
                }`}
              >
                <FileUp className="w-4 h-4" />
                Upload file
              </button>
            </div>

            {uploadError && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {uploadError}
              </div>
            )}

            {/* Below: form (when Enter) or upload zone + optional form (when Upload) */}
            {masterInputMode === 'enter' && (
              <div className="grid sm:grid-cols-2 gap-4">
                {PUMP_MASTER_FIELDS.map((field) => (
                  <div key={field.id} className={field.id === 'pump_id' ? 'sm:col-span-2' : ''}>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                      {field.label}
                      {field.required && <span className="text-red-400"> *</span>}
                    </label>
                    {field.type === 'select' ? (
                      <select
                        value={formData[field.id] ?? ''}
                        onChange={(e) => updateFormField(field.id, e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none text-[var(--text-primary)]"
                      >
                        <option value="">Select...</option>
                        {(field.options || []).map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type}
                        value={formData[field.id] ?? ''}
                        onChange={(e) => {
                          const raw = e.target.value;
                          const value =
                            field.type === 'number' && raw !== ''
                              ? (e.target.valueAsNumber ?? parseFloat(raw, 10))
                              : raw;
                          updateFormField(field.id, value);
                        }}
                        placeholder={field.placeholder}
                        required={field.required}
                        min={field.min}
                        max={field.max}
                        className="w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none text-[var(--text-primary)]"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            {masterInputMode === 'upload' && (
              <div className="space-y-4">
                <p className="text-sm text-[var(--text-secondary)]">
                  Upload a CSV or Excel file with pump_master columns (pump_id, pump_type, manufacturer, model, etc.). First row will be used.
                </p>
                <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-[var(--border-color)] rounded-xl cursor-pointer hover:bg-[var(--bg-secondary)] transition-colors">
                  <Upload className="w-6 h-6 text-[var(--text-tertiary)] mb-1" />
                  <span className="text-sm text-[var(--text-secondary)]">
                    {masterUploading ? 'Uploading…' : masterFile ? masterFile.name : 'Choose .xlsx or .csv'}
                  </span>
                  <input
                    type="file"
                    accept=".csv,.xlsx"
                    className="hidden"
                    disabled={masterUploading}
                    onChange={handleMasterFileSelect}
                  />
                </label>
                {masterDataFromUpload && formData.pump_id && (
                  <p className="text-sm text-green-500 flex items-center gap-2">
                    <Check className="w-4 h-4" /> Loaded pump: <strong>{formData.pump_id}</strong>. You can edit below.
                  </p>
                )}
                {masterDataFromUpload && (
                  <div className="pt-4 border-t border-[var(--border-color)]">
                    <p className="text-sm text-[var(--text-secondary)] mb-4">Review or edit loaded data below:</p>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {PUMP_MASTER_FIELDS.map((field) => (
                        <div key={field.id} className={field.id === 'pump_id' ? 'sm:col-span-2' : ''}>
                          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">{field.label}</label>
                          {field.type === 'select' ? (
                            <select
                              value={formData[field.id] ?? ''}
                              onChange={(e) => updateFormField(field.id, e.target.value)}
                              className="w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] focus:border-primary-500 outline-none text-[var(--text-primary)]"
                            >
                              <option value="">Select...</option>
                              {(field.options || []).map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type={field.type}
                              value={formData[field.id] ?? ''}
                              onChange={(e) => {
                                const raw = e.target.value;
                                const value = field.type === 'number' && raw !== '' ? (e.target.valueAsNumber ?? parseFloat(raw, 10)) : raw;
                                updateFormField(field.id, value);
                              }}
                              className="w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] focus:border-primary-500 outline-none text-[var(--text-primary)]"
                              min={field.min}
                              max={field.max}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleNextFromData}
              disabled={!formData.pump_id}
              className="px-6 py-3 rounded-xl bg-primary-600 hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold flex items-center gap-2"
            >
              Next: Upload operation log
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Operation log upload */}
      {step === STEP_OPERATION_LOG && (
        <div className="space-y-6">
          <button
            type="button"
            onClick={goBack}
            className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm"
          >
            <ChevronLeft className="w-4 h-4" /> Back to master data
          </button>

          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6">
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-primary-500" />
              Operation log (Excel or CSV)
            </h3>
            <p className="text-sm text-[var(--text-secondary)] mb-4">
              Required columns: timestamp, pump_id, flow_m3h, discharge_pressure_bar, suction_pressure_bar, rpm, motor_power_kw, vibration_mm_s, bearing_temp_c, displacement_um, status
            </p>
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-[var(--border-color)] rounded-xl cursor-pointer hover:bg-[var(--bg-secondary)] transition-colors">
              <Upload className="w-8 h-8 text-[var(--text-tertiary)] mb-2" />
              <span className="text-sm text-[var(--text-secondary)]">
                {operationLogFile ? operationLogFile.name : 'Choose .xlsx or .csv'}
              </span>
              <input
                type="file"
                accept=".csv,.xlsx"
                className="hidden"
                onChange={(e) => setOperationLogFile(e.target.files?.[0] || null)}
              />
            </label>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleNextFromOperationLog}
              disabled={!operationLogFile}
              className="px-6 py-3 rounded-xl bg-primary-600 hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold flex items-center gap-2"
            >
              Next: Upload maintenance log
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 5: Maintenance log upload + Submit */}
      {step === STEP_MAINTENANCE_LOG && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <button
            type="button"
            onClick={goBack}
            className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm"
          >
            <ChevronLeft className="w-4 h-4" /> Back to operation log
          </button>

          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6">
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-primary-500" />
              Maintenance log (Excel or CSV)
            </h3>
            <p className="text-sm text-[var(--text-secondary)] mb-4">
              Required columns: date, pump_id, action, component, notes, downtime_hours
            </p>
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-[var(--border-color)] rounded-xl cursor-pointer hover:bg-[var(--bg-secondary)] transition-colors">
              <Upload className="w-8 h-8 text-[var(--text-tertiary)] mb-2" />
              <span className="text-sm text-[var(--text-secondary)]">
                {maintenanceLogFile ? maintenanceLogFile.name : 'Choose .xlsx or .csv'}
              </span>
              <input
                type="file"
                accept=".csv,.xlsx"
                className="hidden"
                onChange={(e) => setMaintenanceLogFile(e.target.files?.[0] || null)}
              />
            </label>
          </div>

          {uploadError && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {uploadError}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={goBack}
              className="px-5 py-3 rounded-xl border border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={!canOpenDashboard || uploading}
              className="px-6 py-3 rounded-xl bg-primary-600 hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold flex items-center gap-2"
            >
              {uploading ? (
                'Uploading…'
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Open Pump Dashboard
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
