import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X, CheckCircle2 } from 'lucide-react';
import clsx from 'clsx';

interface Props {
  label: string;
  description: string;
  accept: Record<string, string[]>;
  multiple?: boolean;
  onFiles: (files: File[]) => void;
  files: File[];
  icon?: React.ReactNode;
}

export default function UploadZone({ label, description, accept, multiple = false, onFiles, files, icon }: Props) {
  const [dragActive, setDragActive] = useState(false);

  const onDrop = useCallback((accepted: File[]) => {
    if (multiple) {
      onFiles(accepted);
    } else {
      onFiles(accepted.slice(0, 1));
    }
    setDragActive(false);
  }, [multiple, onFiles]);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept,
    multiple,
    onDragEnter: () => setDragActive(true),
    onDragLeave: () => setDragActive(false),
  });

  const removeFile = (e: React.MouseEvent, idx: number) => {
    e.stopPropagation();
    onFiles(files.filter((_, i) => i !== idx));
  };

  const hasFiles = files.length > 0;

  return (
    <div
      {...getRootProps()}
      className={clsx(
        'relative border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-200',
        dragActive
          ? 'border-accent-violet bg-accent-violet/10'
          : hasFiles
          ? 'border-status-verified/40 bg-status-verified/5'
          : 'border-border-default bg-bg-elevated hover:border-accent-violet/50 hover:bg-accent-violet/5'
      )}
    >
      <input {...getInputProps()} />

      {hasFiles ? (
        <div className="space-y-2">
          <CheckCircle2 className="w-8 h-8 text-status-verified mx-auto mb-2" />
          {files.map((f, i) => (
            <div key={i} className="flex items-center justify-between bg-bg-card border border-border-subtle rounded-lg px-3 py-2 text-left">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-4 h-4 text-accent-violet flex-shrink-0" />
                <span className="text-xs text-text-primary truncate">{f.name}</span>
                <span className="text-[10px] text-text-muted flex-shrink-0">
                  {(f.size / 1024).toFixed(0)}KB
                </span>
              </div>
              <button
                onClick={(e) => removeFile(e, i)}
                className="ml-2 text-text-muted hover:text-status-missing transition-colors flex-shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {multiple && (
            <p className="text-xs text-text-muted mt-1">Click or drop to add more</p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="w-12 h-12 rounded-xl bg-accent-purple/15 border border-accent-purple/20 flex items-center justify-center mx-auto">
            {icon || <Upload className="w-5 h-5 text-accent-violet" />}
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary">{label}</p>
            <p className="text-xs text-text-muted mt-0.5">{description}</p>
          </div>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {Object.values(accept).flat().map((ext) => (
              <span key={ext} className="text-[10px] border border-border-default text-text-muted px-2 py-0.5 rounded">
                {ext.replace('.', '').toUpperCase()}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
