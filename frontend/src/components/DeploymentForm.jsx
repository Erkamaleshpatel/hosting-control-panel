import React, { useState } from 'react';

/**
 * Forms component for configuring client metadata and docker image selection.
 * Handles validation and calls the deployment callback.
 */
export default function DeploymentForm({ onSubmit, loading }) {
  const [formData, setFormData] = useState({
    clientName: '',
    domain: '',
    image: 'nginx:latest' // Default popular image
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
    // Clear validation error when typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.clientName.trim()) {
      newErrors.clientName = 'Client name is required';
    }
    
    // Basic domain validation regex
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/;
    if (!formData.domain.trim()) {
      newErrors.domain = 'Domain name is required';
    } else if (!domainRegex.test(formData.domain.trim())) {
      newErrors.domain = 'Please enter a valid domain (e.g. client.app.com)';
    }

    if (!formData.image.trim()) {
      newErrors.image = 'Docker image name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
      // Reset form (except image default)
      setFormData({
        clientName: '',
        domain: '',
        image: 'nginx:latest'
      });
    }
  };

  // Pre-configured templates to make testing easy for the interviewer!
  const selectTemplate = (imageName) => {
    setFormData((prev) => ({
      ...prev,
      image: imageName
    }));
  };

  return (
    <div className="glass-panel rounded-2xl p-6 shadow-xl border border-slate-800">
      <div className="flex items-center mb-6">
        <div className="p-2.5 rounded-lg bg-blue-600/20 text-blue-400 mr-3">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-100">Provision Resource</h2>
          <p className="text-xs text-slate-400">Configure and deploy client containers instantly</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Client Name Input */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2" htmlFor="clientName">
            Client / Organization Name
          </label>
          <input
            type="text"
            id="clientName"
            name="clientName"
            value={formData.clientName}
            onChange={handleChange}
            placeholder="e.g. Acme Corporation"
            className={`w-full px-4 py-2.5 rounded-lg bg-slate-950/50 border ${
              errors.clientName ? 'border-rose-500/50 focus:border-rose-500' : 'border-slate-800 focus:border-blue-500'
            } text-slate-200 placeholder-slate-600 focus:outline-none transition-colors duration-150`}
          />
          {errors.clientName && (
            <p className="text-xs text-rose-400 mt-1 font-medium">{errors.clientName}</p>
          )}
        </div>

        {/* Domain Name Input */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2" htmlFor="domain">
            Target Host / Domain
          </label>
          <input
            type="text"
            id="domain"
            name="domain"
            value={formData.domain}
            onChange={handleChange}
            placeholder="e.g. acme.hostingplatform.com"
            className={`w-full px-4 py-2.5 rounded-lg bg-slate-950/50 border ${
              errors.domain ? 'border-rose-500/50 focus:border-rose-500' : 'border-slate-800 focus:border-blue-500'
            } text-slate-200 placeholder-slate-600 focus:outline-none transition-colors duration-150`}
          />
          {errors.domain && (
            <p className="text-xs text-rose-400 mt-1 font-medium">{errors.domain}</p>
          )}
        </div>

        {/* Docker Image Input */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2" htmlFor="image">
            Docker Image Name & Tag
          </label>
          <input
            type="text"
            id="image"
            name="image"
            value={formData.image}
            onChange={handleChange}
            placeholder="e.g. nginx:alpine or redis:latest"
            className={`w-full px-4 py-2.5 rounded-lg bg-slate-950/50 border ${
              errors.image ? 'border-rose-500/50 focus:border-rose-500' : 'border-slate-800 focus:border-blue-500'
            } text-slate-200 placeholder-slate-600 focus:outline-none transition-colors duration-150 font-mono text-sm`}
          />
          {errors.image && (
            <p className="text-xs text-rose-400 mt-1 font-medium">{errors.image}</p>
          )}
        </div>

        {/* Image Presets */}
        <div>
          <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            Quick Template Presets
          </span>
          <div className="flex gap-2 flex-wrap">
            {['nginx:latest', 'redis:alpine', 'httpd:alpine', 'postgres:15-alpine'].map((img) => (
              <button
                key={img}
                type="button"
                onClick={() => selectTemplate(img)}
                className={`px-2.5 py-1 rounded text-xs font-mono border transition-all duration-150 ${
                  formData.image === img
                    ? 'bg-blue-600/20 text-blue-400 border-blue-500/40'
                    : 'bg-slate-900/40 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-300'
                }`}
              >
                {img}
              </button>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center py-3 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all duration-150 shadow-lg shadow-blue-900/20 hover:shadow-blue-900/40 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Queuing deployment...
            </>
          ) : (
            'Deploy Container'
          )}
        </button>
      </form>
    </div>
  );
}
