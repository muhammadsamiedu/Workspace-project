'use client';

import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppRedux';
import { closeModal, showToast } from '@/redux/slices/uiSlice';
import { updateProfile, logout } from '@/redux/slices/authSlice';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { generateId } from '@/lib/utils';
import { LogOut } from 'lucide-react';

export function ProfileModal() {
  const dispatch = useAppDispatch();
  const activeModal = useAppSelector((state) => state.ui.activeModal);
  const currentUser = useAppSelector((state) => state.auth.currentUser);

  const isOpen = activeModal === 'profile_modal';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [avatar, setAvatar] = useState('');
  const [bio, setBio] = useState('');

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name);
      setEmail(currentUser.email);
      setAvatar(currentUser.avatar);
      setBio(currentUser.bio || '');
    }
  }, [currentUser, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    dispatch(
      updateProfile({
        name: name.trim(),
        email: email.trim(),
        avatar: avatar.trim(),
        bio: bio.trim(),
      })
    );

    dispatch(
      showToast({
        id: generateId('toast'),
        message: 'Profile updated successfully!',
        type: 'success',
      })
    );
    dispatch(closeModal());
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => dispatch(closeModal())}
      title="User Profile"
      description="Update your display name, avatar, and bio"
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center gap-3.5 pb-2">
          <Avatar name={name || 'User'} src={avatar} size="lg" />
          <div>
            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{name || 'User'}</h4>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Badge variant="indigo" size="sm">
                Role: {currentUser.role}
              </Badge>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
            Full Name
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name..."
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
            Email Address
          </label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@workspace.io"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
            Avatar Image URL
          </label>
          <Input
            value={avatar}
            onChange={(e) => setAvatar(e.target.value)}
            placeholder="https://images.unsplash.com/..."
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
            Bio
          </label>
          <Textarea
            rows={2}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Product Lead, React engineer, designer..."
          />
        </div>

        <div className="flex items-center justify-between gap-2.5 pt-3 border-t border-zinc-100 dark:border-zinc-800">
          <Button
            variant="danger"
            type="button"
            size="sm"
            onClick={() => {
              dispatch(closeModal());
              dispatch(logout());
              dispatch(
                showToast({
                  id: generateId('toast'),
                  message: 'You have been logged out.',
                  type: 'info',
                })
              );
            }}
            leftIcon={<LogOut className="w-4 h-4" />}
          >
            Log Out
          </Button>
          <div className="flex items-center gap-2.5">
            <Button variant="outline" type="button" size="sm" onClick={() => dispatch(closeModal())}>
              Cancel
            </Button>
            <Button type="submit" size="sm">Save Profile</Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
