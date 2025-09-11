'use client';

import { useState, useEffect } from 'react';

interface DisplayData {
  Text: string;
  Name: string;
  Description: string;
  Personnel: string;
  Standing: boolean;
  wasMatched: boolean;
}

interface BulletinEditorProps {
  data: DisplayData[];
  onDataChange: (updatedData: DisplayData[]) => void;
  filename?: string;
}

interface PersonnelSelectorProps {
  value: string;
  onChange: (value: string) => void;
  personnel: string[];
  onAddPersonnel: (name: string) => void;
  isEditing: boolean;
  itemId: string;
}

function PersonnelSelector({ value, onChange, personnel, onAddPersonnel, isEditing, itemId }: PersonnelSelectorProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredPersonnel, setFilteredPersonnel] = useState<string[]>(personnel);

  if (!isEditing) {
    return <span className="text-gray-900">{value || <em className="text-gray-400">No personnel</em>}</span>;
  }

  const handlePersonnelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    onChange(inputValue);
    
    // Filter personnel based on input
    const filtered = personnel.filter(person => 
      person.toLowerCase().includes(inputValue.toLowerCase())
    );
    setFilteredPersonnel(filtered);
    setShowDropdown(filtered.length > 0 && inputValue.length > 0);
  };

  const handlePersonnelBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Delay hiding dropdown to allow clicking on options
    setTimeout(() => {
      setShowDropdown(false);
      const newValue = e.target.value.trim();
      if (newValue && !personnel.includes(newValue)) {
        onAddPersonnel(newValue);
      }
    }, 150);
  };

  const handlePersonnelFocus = () => {
    setFilteredPersonnel(personnel);
    setShowDropdown(personnel.length > 0);
  };

  const selectPersonnel = (person: string) => {
    onChange(person);
    setShowDropdown(false);
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={handlePersonnelChange}
        onBlur={handlePersonnelBlur}
        onFocus={handlePersonnelFocus}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-8"
        placeholder="Select or type personnel name..."
        autoComplete="off"
        title={`Available personnel: ${personnel.join(', ')}`}
      />
      
      {/* Custom dropdown */}
      {showDropdown && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-40 overflow-y-auto">
          {filteredPersonnel.map((person) => (
            <div
              key={person}
              onClick={() => selectPersonnel(person)}
              className="px-3 py-2 cursor-pointer hover:bg-blue-50 text-sm border-b border-gray-100 last:border-b-0"
            >
              {person}
            </div>
          ))}
        </div>
      )}
      
      {/* Fallback datalist for native browser support */}
      <datalist id={`personnel-${itemId}`}>
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
  );
}

interface BulletinItemRowProps {
  item: DisplayData;
  index: number;
  isEditing: boolean;
  onUpdate: (updatedItem: DisplayData) => void;
  onRemove: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  isDragging: boolean;
  isDragOver: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  personnel: string[];
  onAddPersonnel: (name: string) => void;
}

function BulletinItemRow({ 
  item, 
  index, 
  isEditing, 
  onUpdate, 
  onRemove, 
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  isDragging,
  isDragOver,
  onMoveUp, 
  onMoveDown, 
  personnel, 
  onAddPersonnel 
}: BulletinItemRowProps) {
  const handleFieldChange = (field: keyof DisplayData, value: string | boolean) => {
    onUpdate({ ...item, [field]: value });
  };

  const getRowClasses = () => {
    let classes = index % 2 === 0 ? 'bg-white' : 'bg-gray-50';
    if (isDragging) classes += ' opacity-50';
    if (isDragOver) classes += ' bg-blue-100';
    if (isEditing) classes += ' cursor-move';
    return classes;
  };

  return (
    <tr 
      className={getRowClasses()}
      draggable={isEditing}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
    >
      {/* Standing */}
      <td className="border border-gray-300 px-2 py-2 text-center w-24">
        {isEditing ? (
          <input
            type="checkbox"
            checked={item.Standing}
            onChange={(e) => handleFieldChange('Standing', e.target.checked)}
            className="rounded"
          />
        ) : (
          <span className="text-lg">{item.Standing ? '✓' : '○'}</span>
        )}
      </td>

      {/* Name */}
      <td className="border border-gray-300 px-3 py-2">
        {isEditing ? (
          <input
            type="text"
            value={item.Name}
            onChange={(e) => handleFieldChange('Name', e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        ) : (
          <span className="text-gray-900">{item.Name}</span>
        )}
      </td>

      {/* Description */}
      <td className="border border-gray-300 px-3 py-2">
        {isEditing ? (
          <textarea
            value={item.Description}
            onChange={(e) => handleFieldChange('Description', e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 resize-y"
            placeholder="Description"
            rows={2}
          />
        ) : (
          <span className="text-gray-900">{item.Description || <em className="text-gray-400">No description</em>}</span>
        )}
      </td>

      {/* Personnel */}
      <td className="border border-gray-300 px-3 py-2">
        <PersonnelSelector
          value={item.Personnel}
          onChange={(value) => handleFieldChange('Personnel', value)}
          personnel={personnel}
          onAddPersonnel={onAddPersonnel}
          isEditing={isEditing}
          itemId={`bulletin-${index}`}
        />
      </td>

      {/* Actions */}
      {isEditing && (
        <td className="border border-gray-300 px-2 py-2">
          <div className="flex justify-center items-center gap-1">
            <div className="flex flex-col">
              {onMoveUp && (
                <button
                  onClick={onMoveUp}
                  className="p-0.5 text-gray-400 hover:text-gray-600 text-xs leading-none"
                  title="Move up"
                >
                  ▲
                </button>
              )}
              {onMoveDown && (
                <button
                  onClick={onMoveDown}
                  className="p-0.5 text-gray-400 hover:text-gray-600 text-xs leading-none"
                  title="Move down"
                >
                  ▼
                </button>
              )}
            </div>
            <span
              className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 text-sm px-1"
              title="Drag to reorder"
            >
              ⋮⋮
            </span>
            <button
              onClick={() => {
                if (confirm(`Are you sure you want to remove "${item.Name || 'this item'}"?`)) {
                  onRemove();
                }
              }}
              className="p-1 text-red-400 hover:text-red-600 text-xs"
              title="Remove item"
            >
              ✕
            </button>
          </div>
        </td>
      )}
    </tr>
  );
}

export default function BulletinEditor({ data, onDataChange, filename }: BulletinEditorProps) {
  const [editedData, setEditedData] = useState<DisplayData[]>(data);
  const [isEditing, setIsEditing] = useState(false);
  const [personnel, setPersonnel] = useState<string[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Load personnel on component mount
  useEffect(() => {
    loadPersonnel();
  }, []);

  // Update edited data when prop data changes
  useEffect(() => {
    setEditedData(data);
  }, [data]);

  const loadPersonnel = async () => {
    try {
      const response = await fetch('/data/personnel.json');
      if (response.ok) {
        const personnelData = await response.json();
        // Handle both formats: array of strings or array of objects with 'name' property
        if (Array.isArray(personnelData) && personnelData.length > 0) {
          if (typeof personnelData[0] === 'string') {
            setPersonnel(personnelData);
          } else if (personnelData[0].name) {
            setPersonnel(personnelData.map(p => p.name));
          }
        } else {
          setPersonnel([]);
        }
      }
    } catch (error) {
      console.error('Failed to load personnel:', error);
    }
  };

  const addNewPersonnel = async (name: string) => {
    // Since we can't write to public/data from the browser, just add to local state
    // In production, this would need a proper backend endpoint to persist
    try {
      setPersonnel([...personnel, name]);
    } catch (error) {
      console.error('Failed to add personnel:', error);
    }
  };


  const startEditing = () => {
    setIsEditing(true);
  };

  const saveChanges = () => {
    onDataChange(editedData);
    setIsEditing(false);
  };

  const cancelEditing = () => {
    setEditedData(data); // Reset to original data
    setIsEditing(false);
  };


  const updateBulletinItem = (index: number, updatedItem: DisplayData) => {
    const updatedData = [...editedData];
    updatedData[index] = updatedItem;
    setEditedData(updatedData);
  };

  const addBulletinItem = () => {
    const newItem: DisplayData = {
      Text: 'New Item',
      Name: 'New Item',
      Description: '',
      Personnel: '',
      Standing: false,
      wasMatched: false
    };

    setEditedData([...editedData, newItem]);
  };

  const removeBulletinItem = (index: number) => {
    const updatedData = editedData.filter((_, i) => i !== index);
    setEditedData(updatedData);
  };

  const moveItem = (fromIndex: number, toIndex: number) => {
    const items = [...editedData];
    const [movedItem] = items.splice(fromIndex, 1);
    items.splice(toIndex, 0, movedItem);
    setEditedData(items);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (!isEditing) return;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', '');
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    if (!isEditing || draggedIndex === null) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    if (!isEditing || draggedIndex === null) return;
    e.preventDefault();
    
    if (draggedIndex !== dropIndex) {
      moveItem(draggedIndex, dropIndex);
    }
    
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Service Bulletin</h2>
          {filename && (
            <p className="text-sm text-gray-600 mt-1">
              Source: {filename}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {!isEditing ? (
            <button
              onClick={startEditing}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Edit
            </button>
          ) : (
            <>
              <button
                onClick={saveChanges}
                className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Save
              </button>
              <button
                onClick={cancelEditing}
                className="px-3 py-1 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>


      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-md font-medium text-gray-900">Bulletin Items</h3>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{editedData.length} items</span>
            {isEditing && (
              <button
                onClick={addBulletinItem}
                className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Add Item
              </button>
            )}
          </div>
        </div>


        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-2 py-2 text-center text-sm font-semibold w-24">Standing</th>
                <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">Item Name</th>
                <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">Description</th>
                <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">Personnel</th>
                {isEditing && (
                  <th className="border border-gray-300 px-3 py-2 text-center text-sm font-semibold">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {editedData.map((item, index) => (
                <BulletinItemRow
                  key={index}
                  item={item}
                  index={index}
                  isEditing={isEditing}
                  onUpdate={(updatedItem) => updateBulletinItem(index, updatedItem)}
                  onRemove={() => removeBulletinItem(index)}
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  isDragging={draggedIndex === index}
                  isDragOver={dragOverIndex === index}
                  onMoveUp={index > 0 ? () => moveItem(index, index - 1) : undefined}
                  onMoveDown={index < editedData.length - 1 ? () => moveItem(index, index + 1) : undefined}
                  personnel={personnel}
                  onAddPersonnel={addNewPersonnel}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}