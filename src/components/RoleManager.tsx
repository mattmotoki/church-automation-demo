'use client';

import { useState, useEffect } from 'react';
import { ServiceRoles, TemplateRole } from '@/types/bulletin';

interface RoleManagerProps {
  initialRoles?: ServiceRoles;
  onRolesChange?: (roles: ServiceRoles) => void;
  personnel: string[];
  templateRoles?: TemplateRole[];
}

interface RoleDisplayProps {
  role: string;
  person: string;
  tasks: string[];
  personnel: string[];
  onPersonChange: (person: string) => void;
  defaultPerson?: string;
}

function RoleDisplay({ role, person, tasks, personnel, onPersonChange, defaultPerson }: RoleDisplayProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(person);

  const handleSave = () => {
    onPersonChange(editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(person);
    setIsEditing(false);
  };

  const getRoleIcon = (role: string) => {
    const roleLower = role.toLowerCase();
    if (roleLower.includes('pastor') && roleLower.includes('lead')) {
      return '👨‍💼';
    } else if (roleLower.includes('pastor') && roleLower.includes('assistant')) {
      return '🤝';
    } else if (roleLower.includes('song') || roleLower.includes('music')) {
      return '🎵';
    } else if (roleLower.includes('pianist') || roleLower.includes('piano')) {
      return '🎹';
    } else if (roleLower.includes('shell')) {
      return '🐚';
    } else if (roleLower.includes('liturgist')) {
      return '📖';
    } else {
      return '👤';
    }
  };

  const formatRoleName = (role: string) => {
    return role.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4 border">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">{getRoleIcon(role)}</span>
          <h3 className="text-lg font-semibold text-gray-900">{formatRoleName(role)}</h3>
          {defaultPerson && (
            <span className="text-sm text-gray-500">(default: {defaultPerson})</span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {isEditing ? (
            <>
              <div className="relative">
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  list={`${role}-personnel`}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-48"
                  placeholder="Select or type name..."
                  autoComplete="off"
                  title={`Available personnel: ${personnel.join(', ')}`}
                />
                <datalist id={`${role}-personnel`}>
                  {personnel.map((person) => (
                    <option key={person} value={person} />
                  ))}
                </datalist>
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              <button
                onClick={handleSave}
                className="px-3 py-2 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                title="Save"
              >
                ✓
              </button>
              <button
                onClick={handleCancel}
                className="px-3 py-2 text-xs bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                title="Cancel"
              >
                ✕
              </button>
            </>
          ) : (
            <>
              <span className="text-sm font-medium text-gray-700 min-w-32">
                {person || <em className="text-gray-400">Not assigned</em>}
              </span>
              <button
                onClick={() => setIsEditing(true)}
                className="px-3 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Edit
              </button>
            </>
          )}
        </div>
      </div>
      
      <div>
        <h4 className="text-sm font-medium text-gray-600 mb-2">Responsible for:</h4>
        <div className="flex flex-wrap gap-1">
          {tasks.map((task) => (
            <span
              key={task}
              className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
            >
              {task}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function RoleManager({ initialRoles, onRolesChange, personnel, templateRoles }: RoleManagerProps) {
  const [roles, setRoles] = useState<ServiceRoles>(initialRoles || {});

  useEffect(() => {
    if (initialRoles) {
      setRoles(initialRoles);
    }
  }, [initialRoles]);

  const handleRoleChange = (role: string, person: string) => {
    const updatedRoles = { ...roles, [role]: person };
    setRoles(updatedRoles);
    onRolesChange?.(updatedRoles);
  };

  const handleAutoAssign = () => {
    // Auto-assign based on template defaults
    const autoRoles = { ...roles };
    
    if (templateRoles) {
      templateRoles.forEach(templateRole => {
        // Only auto-assign if role is currently empty and template has a default person
        if (!autoRoles[templateRole.name] && templateRole.defaultPerson) {
          autoRoles[templateRole.name] = templateRole.defaultPerson;
        }
      });
    }
    
    setRoles(autoRoles);
    onRolesChange?.(autoRoles);
  };

  const handleClearAll = () => {
    const clearedRoles: ServiceRoles = {};
    
    if (templateRoles) {
      templateRoles.forEach(templateRole => {
        clearedRoles[templateRole.name] = '';
      });
    }
    
    setRoles(clearedRoles);
    onRolesChange?.(clearedRoles);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Service Roles</h2>
        <div className="flex space-x-2">
          <button
            onClick={handleAutoAssign}
            className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
          >
            Auto-assign
          </button>
          <button
            onClick={handleClearAll}
            className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Clear All
          </button>
        </div>
      </div>
      
      <div className="space-y-4">
        {templateRoles ? (
          templateRoles.map((templateRole) => (
            <RoleDisplay
              key={templateRole.name}
              role={templateRole.name}
              person={roles[templateRole.name] || ''}
              tasks={templateRole.tasks}
              personnel={personnel}
              onPersonChange={(person) => handleRoleChange(templateRole.name, person)}
              defaultPerson={templateRole.defaultPerson}
            />
          ))
        ) : (
          <div className="text-gray-500 text-center py-4">
            No template selected. Please select a template to manage roles.
          </div>
        )}
      </div>
      
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <div className="flex">
          <svg className="w-5 h-5 text-blue-400 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm">
            <p className="text-blue-800 font-medium">Role Assignment</p>
            <p className="text-blue-700 mt-1">
              Assign people to roles and their tasks will be automatically filled in the bulletin. 
              When parsing HTML files, roles are detected from personnel assignments and applied to all relevant tasks.
            </p>
            <p className="text-blue-700 mt-2">
              <strong>Available personnel ({personnel.length}):</strong> {personnel.join(', ')}
            </p>
            {process.env.NODE_ENV === 'development' && (
              <p className="text-blue-600 text-xs mt-1">
                Debug: Personnel array loaded from API
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}