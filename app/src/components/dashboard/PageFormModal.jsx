import { useEffect, useState } from "react";

function PageFormModal({
  isOpen,
  onClose,
  title,
  description,
  fields = [],
  submitLabel = "Save",
}) {
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const initialData = fields.reduce((acc, field) => {
      acc[field.name] = "";
      return acc;
    }, {});

    setFormData(initialData);
  }, [isOpen, fields]);

  if (!isOpen) {
    return null;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onClose();
  };

  return (
    <div className="page-form-overlay" role="dialog" aria-modal="true">
      <div className="page-form-modal">
        <div className="page-form-header">
          <h3>{title}</h3>
          <button type="button" className="page-form-close" onClick={onClose}>
            Close
          </button>
        </div>
        {description && <p className="page-form-description">{description}</p>}

        <form className="page-form-body" onSubmit={handleSubmit}>
          {fields.map((field) => (
            <label key={field.name} className="page-form-field">
              <span>{field.label}</span>
              {field.type === "textarea" ? (
                <textarea
                  name={field.name}
                  value={formData[field.name] ?? ""}
                  placeholder={field.placeholder}
                  rows={4}
                  onChange={handleChange}
                />
              ) : (
                <input
                  type={field.type || "text"}
                  name={field.name}
                  value={formData[field.name] ?? ""}
                  placeholder={field.placeholder}
                  onChange={handleChange}
                />
              )}
            </label>
          ))}

          <div className="page-form-actions">
            <button type="button" className="page-form-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="page-form-submit">
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PageFormModal;
