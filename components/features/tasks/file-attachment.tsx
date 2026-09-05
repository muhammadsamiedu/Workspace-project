'use client';

import React, { useRef } from 'react';
import { useAppDispatch } from '@/hooks/useAppRedux';
import { addAttachment, deleteAttachment } from '@/redux/slices/taskSlice';
import { usePermissions } from '@/hooks/usePermissions';
import { Attachment } from '@/lib/types';
import { readFileAsDataUrl, generateId } from '@/lib/utils';
import { Paperclip, Trash2, File, Image as ImageIcon, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FileAttachmentProps {
  taskId: string;
  attachments: Attachment[];
}

export function FileAttachment({ taskId, attachments }: FileAttachmentProps) {
  const dispatch = useAppDispatch();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { canAttachFiles, isViewer } = usePermissions();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await readFileAsDataUrl(file);
      const newAttachment: Attachment = {
        id: generateId('att'),
        name: file.name,
        size: file.size,
        type: file.type,
        dataUrl,
        uploadedAt: new Date().toISOString(),
      };

      dispatch(addAttachment({ taskId, attachment: newAttachment }));
    } catch (err) {
      console.error('Error reading attachment file:', err);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-3 select-none">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Paperclip className="w-4 h-4 text-indigo-500" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
            Attachments ({attachments.length})
          </h4>
        </div>

        {canAttachFiles && (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button
              size="xs"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              leftIcon={<Paperclip className="w-3.5 h-3.5" />}
            >
              Attach File
            </Button>
          </div>
        )}
      </div>

      {attachments.length === 0 ? (
        <div
          onClick={() => canAttachFiles && fileInputRef.current?.click()}
          className={`p-4 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 text-center text-xs text-zinc-400 ${
            canAttachFiles ? 'cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/40' : ''
          }`}
        >
          No files attached. {canAttachFiles ? 'Click to upload a file preview (stored locally in state).' : ''}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {attachments.map((att) => {
            const isImage = att.type.startsWith('image/');
            return (
              <div
                key={att.id}
                className="group relative flex items-center gap-3 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs hover:shadow-xs transition-all"
              >
                {/* Preview or Icon */}
                <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                  {isImage ? (
                    <img
                      src={att.dataUrl}
                      alt={att.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <File className="w-5 h-5 text-zinc-400" />
                  )}
                </div>

                {/* Details */}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate">
                    {att.name}
                  </p>
                  <p className="text-[10px] text-zinc-400">{formatFileSize(att.size)}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <a
                    href={att.dataUrl}
                    download={att.name}
                    className="p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                    title="Download"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>

                  {!isViewer && (
                    <button
                      onClick={() =>
                        dispatch(deleteAttachment({ taskId, attachmentId: att.id }))
                      }
                      className="p-1 rounded text-zinc-400 hover:text-rose-500 transition-colors cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
