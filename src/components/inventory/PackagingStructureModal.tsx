import React, { useState } from 'react';
import { X, Plus, Trash2, Package } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/axios';

interface PackagingLevel {
  name: string;
  contains?: number;
  level: number;
}

interface PackagingLevels {
  baseUnit: PackagingLevel;
  level2?: PackagingLevel;
  level3?: PackagingLevel;
  level4?: PackagingLevel;
}

interface PackagingStructureModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  onSuccess?: () => void;
}

const PackagingStructureModal: React.FC<PackagingStructureModalProps> = ({
  isOpen,
  onClose,
  productId,
  productName,
  onSuccess,
}) => {
  const queryClient = useQueryClient();
  const [structureName, setStructureName] = useState('');
  const [primarySupplier, setPrimarySupplier] = useState('');
  const [baseUnitName, setBaseUnitName] = useState('Piece');

  // Level 2 (Box/Container)
  const [hasLevel2, setHasLevel2] = useState(false);
  const [level2Name, setLevel2Name] = useState('Box');
  const [level2Contains, setLevel2Contains] = useState(10);

  // Level 3 (Case/Carton)
  const [hasLevel3, setHasLevel3] = useState(false);
  const [level3Name, setLevel3Name] = useState('Case');
  const [level3Contains, setLevel3Contains] = useState(10);

  // Level 4 (Pallet)
  const [hasLevel4, setHasLevel4] = useState(false);
  const [level4Name, setLevel4Name] = useState('Pallet');
  const [level4Contains, setLevel4Contains] = useState(20);

  const createPackagingMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/inventory/packaging-structures', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packaging-structures', productId] });
      if (onSuccess) onSuccess();
      handleClose();
    },
  });

  const handleClose = () => {
    setStructureName('');
    setPrimarySupplier('');
    setBaseUnitName('Piece');
    setHasLevel2(false);
    setLevel2Name('Box');
    setLevel2Contains(10);
    setHasLevel3(false);
    setLevel3Name('Case');
    setLevel3Contains(10);
    setHasLevel4(false);
    setLevel4Name('Pallet');
    setLevel4Contains(20);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const levels: PackagingLevels = {
      baseUnit: {
        name: baseUnitName,
        level: 1,
      },
    };

    if (hasLevel2) {
      levels.level2 = {
        name: level2Name,
        contains: level2Contains,
        level: 2,
      };
    }

    if (hasLevel3 && hasLevel2) {
      levels.level3 = {
        name: level3Name,
        contains: level3Contains,
        level: 3,
      };
    }

    if (hasLevel4 && hasLevel3) {
      levels.level4 = {
        name: level4Name,
        contains: level4Contains,
        level: 4,
      };
    }

    createPackagingMutation.mutate({
      productId,
      name: structureName,
      levels,
      primarySupplier: primarySupplier || undefined,
    });
  };

  const calculateExample = () => {
    let example = `1 ${baseUnitName}`;

    if (hasLevel2) {
      example = `1 ${level2Name} = ${level2Contains} ${baseUnitName}s`;
    }

    if (hasLevel3 && hasLevel2) {
      const total = level3Contains * level2Contains;
      example = `1 ${level3Name} = ${level3Contains} ${level2Name}s = ${total} ${baseUnitName}s`;
    }

    if (hasLevel4 && hasLevel3 && hasLevel2) {
      const totalBoxes = level4Contains * level3Contains;
      const totalPieces = totalBoxes * level2Contains;
      example = `1 ${level4Name} = ${level4Contains} ${level3Name}s = ${totalBoxes} ${level2Name}s = ${totalPieces} ${baseUnitName}s`;
    }

    return example;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Create Packaging Structure</h2>
              <p className="text-sm text-gray-500">{productName}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1">
          {/* Basic Info */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Structure Name *
              </label>
              <input
                type="text"
                value={structureName}
                onChange={(e) => setStructureName(e.target.value)}
                placeholder="e.g., Bulk Pallet 20x10, Standard Box"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Primary Supplier (Optional)
              </label>
              <input
                type="text"
                value={primarySupplier}
                onChange={(e) => setPrimarySupplier(e.target.value)}
                placeholder="Supplier name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Base Unit */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Base Unit (Level 1) *</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit Name
              </label>
              <input
                type="text"
                value={baseUnitName}
                onChange={(e) => setBaseUnitName(e.target.value)}
                placeholder="e.g., Piece, Unit, Item"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* Level 2 */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900">Level 2 (Container)</h3>
              <button
                type="button"
                onClick={() => setHasLevel2(!hasLevel2)}
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                  hasLevel2
                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
              >
                {hasLevel2 ? <><Trash2 className="w-4 h-4 inline mr-1" />Remove</> : <><Plus className="w-4 h-4 inline mr-1" />Add Level</>}
              </button>
            </div>
            {hasLevel2 && (
              <div className="grid grid-cols-2 gap-4 pl-4 border-l-2 border-blue-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Container Name
                  </label>
                  <input
                    type="text"
                    value={level2Name}
                    onChange={(e) => setLevel2Name(e.target.value)}
                    placeholder="e.g., Box, Pack"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contains (Base Units)
                  </label>
                  <input
                    type="number"
                    value={level2Contains}
                    onChange={(e) => setLevel2Contains(Number(e.target.value))}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
            )}
          </div>

          {/* Level 3 */}
          {hasLevel2 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900">Level 3 (Case/Carton)</h3>
                <button
                  type="button"
                  onClick={() => setHasLevel3(!hasLevel3)}
                  className={`px-3 py-1 rounded-md text-sm font-medium ${
                    hasLevel3
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }`}
                >
                  {hasLevel3 ? <><Trash2 className="w-4 h-4 inline mr-1" />Remove</> : <><Plus className="w-4 h-4 inline mr-1" />Add Level</>}
                </button>
              </div>
              {hasLevel3 && (
                <div className="grid grid-cols-2 gap-4 pl-4 border-l-2 border-green-200">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Case Name
                    </label>
                    <input
                      type="text"
                      value={level3Name}
                      onChange={(e) => setLevel3Name(e.target.value)}
                      placeholder="e.g., Case, Carton"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contains (Level 2)
                    </label>
                    <input
                      type="number"
                      value={level3Contains}
                      onChange={(e) => setLevel3Contains(Number(e.target.value))}
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Level 4 */}
          {hasLevel3 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900">Level 4 (Pallet/Container)</h3>
                <button
                  type="button"
                  onClick={() => setHasLevel4(!hasLevel4)}
                  className={`px-3 py-1 rounded-md text-sm font-medium ${
                    hasLevel4
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }`}
                >
                  {hasLevel4 ? <><Trash2 className="w-4 h-4 inline mr-1" />Remove</> : <><Plus className="w-4 h-4 inline mr-1" />Add Level</>}
                </button>
              </div>
              {hasLevel4 && (
                <div className="grid grid-cols-2 gap-4 pl-4 border-l-2 border-purple-200">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pallet Name
                    </label>
                    <input
                      type="text"
                      value={level4Name}
                      onChange={(e) => setLevel4Name(e.target.value)}
                      placeholder="e.g., Pallet, Master Carton"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contains (Level 3)
                    </label>
                    <input
                      type="number"
                      value={level4Contains}
                      onChange={(e) => setLevel4Contains(Number(e.target.value))}
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Example Calculation */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm font-medium text-blue-900 mb-1">Structure Example:</p>
            <p className="text-sm text-blue-700 font-mono">{calculateExample()}</p>
          </div>

          {/* Error Message */}
          {createPackagingMutation.isError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">
                Failed to create packaging structure. Please try again.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createPackagingMutation.isPending}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              {createPackagingMutation.isPending ? 'Creating...' : 'Create Structure'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PackagingStructureModal;
