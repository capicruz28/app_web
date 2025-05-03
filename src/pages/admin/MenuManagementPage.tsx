// src/pages/admin/MenuManagementPage.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Tree,
  NodeModel,
  RenderParams,
  DropOptions,
  TreeMethods
} from '@minoru/react-dnd-treeview';
import toast from 'react-hot-toast';

// --- Importaciones de Servicios y Tipos Propios ---
import { menuService } from '../../services/menu.service'; // Ajusta la ruta si es necesario
import type {
  AreaSimpleList,
  BackendManageMenuItem,
  MenuCreateData,
  MenuUpdateData, // Asegúrate de tener este tipo definido
} from '../../types/menu.types'; // Ajusta la ruta si es necesario

// --- Definición del Tipo para el campo 'data' de nuestros nodos ---
interface MenuNodeData {
  menu_id: number;
  nombre: string; // Asumiendo que nombre siempre viene del backend como string
  icono?: string | null;
  ruta?: string | null;
  padre_menu_id?: number | null;
  orden?: number | null;
  es_activo: boolean;
  area_id?: number | null;
  area_nombre?: string | null;
}

// --- Tipo para el formulario de edición (campos editables) ---
// Derivado de MenuUpdateData, excluyendo campos manejados por drag/drop
type EditFormData = Omit<MenuUpdateData, 'padre_menu_id' | 'orden'>;

// --- Componente Principal ---
const MenuManagementPage: React.FC = () => {
  // --- Estados ---
  const [areas, setAreas] = useState<AreaSimpleList[]>([]);
  const [selectedAreaId, setSelectedAreaId] = useState<number | null>(null);
  const [treeViewData, setTreeViewData] = useState<NodeModel<MenuNodeData>[]>([]);
  const [initiallyOpenIds, setInitiallyOpenIds] = useState<(number | string)[]>([]);
  const [isLoadingAreas, setIsLoadingAreas] = useState<boolean>(false);
  const [isLoadingTree, setIsLoadingTree] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Estados para Modales
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editingNodeData, setEditingNodeData] = useState<NodeModel<MenuNodeData> | null>(null);
  const [parentNodeForCreate, setParentNodeForCreate] = useState<NodeModel<MenuNodeData> | null>(null);
  const treeRef = useRef<TreeMethods>(null);

  // Estado para el formulario de creación
  const [newMenuData, setNewMenuData] = useState<Omit<MenuCreateData, 'area_id' | 'padre_menu_id'>>({
    nombre: '',
    icono: '',
    ruta: '',
    es_activo: true,
  });

  // Estado para el formulario de edición
  const [editFormData, setEditFormData] = useState<EditFormData>({
    nombre: '', // Inicializado como string vacío
    icono: '',  // Inicializado como string vacío
    ruta: '',   // Inicializado como string vacío
    es_activo: true,
  });

  // Estado para indicar carga en submits
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Cargar Lista de Áreas ---
  useEffect(() => {
    const fetchAreas = async () => { setIsLoadingAreas(true); setError(null); try { const areaList = await menuService.getAreaList(); setAreas(areaList); } catch (err) { console.error("Error fetching areas:", err); setError("No se pudo cargar la lista de áreas."); toast.error("Error al cargar áreas."); } finally { setIsLoadingAreas(false); } }; fetchAreas();
  }, []);

  // --- Función para transformar datos del Backend ---
  const transformBackendDataToTreeNodes = useCallback((nodes: BackendManageMenuItem[]): NodeModel<MenuNodeData>[] => {
    const treeNodes: NodeModel<MenuNodeData>[] = [];
    function flattenNodes(backendNodes: BackendManageMenuItem[], parentId: number | string) {
      backendNodes.forEach(node => {
        const hasChildren = node.children && node.children.length > 0;
        const treeNode: NodeModel<MenuNodeData> = {
          id: node.menu_id, parent: parentId, text: node.nombre, droppable: true,
          data: { menu_id: node.menu_id, nombre: node.nombre, icono: node.icono, ruta: node.ruta, orden: node.orden, es_activo: node.es_activo, area_id: node.area_id, area_nombre: node.area_nombre, },
        };
        treeNodes.push(treeNode);
        if (hasChildren) { flattenNodes(node.children, node.menu_id); }
      });
    }
    flattenNodes(nodes, 0); return treeNodes;
  }, []);

  // --- Cargar Árbol de Menú ---
  useEffect(() => {
    if (selectedAreaId === null) { setTreeViewData([]); setInitiallyOpenIds([]); return; }
    const fetchMenuTree = async () => {
      setIsLoadingTree(true); setError(null);
      try {
        const backendTree = await menuService.getMenuTreeByArea(selectedAreaId);
        const transformedNodes = transformBackendDataToTreeNodes(backendTree);
        setTreeViewData(transformedNodes);
        const idsToOpen = transformedNodes.filter(node => node.droppable).map(node => node.id);
        setInitiallyOpenIds(idsToOpen);
      } catch (err) { console.error(`Error fetching menu tree:`, err); setError("No se pudo cargar el menú."); toast.error("Error al cargar el menú."); setTreeViewData([]); setInitiallyOpenIds([]); }
      finally { setIsLoadingTree(false); }
    };
    fetchMenuTree();
  }, [selectedAreaId, transformBackendDataToTreeNodes]);

  // --- Manejadores de Eventos ---

  const handleAreaChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newAreaId = parseInt(event.target.value, 10);
    setSelectedAreaId(isNaN(newAreaId) ? null : newAreaId);
  };

  // --- Manejador onDrop ---
  const handleDrop = useCallback((newTreeData: NodeModel<MenuNodeData>[], options: DropOptions<MenuNodeData>) => {
    const { dragSourceId, dropTargetId, destinationIndex } = options;
    if (dragSourceId === undefined || dropTargetId === undefined || typeof dragSourceId !== 'number') { setError("Error al procesar."); toast.error("Error al mover."); return; }
    let newParentId: number | null = null;
    if (dropTargetId !== 0) { if (typeof dropTargetId !== 'number') { setError("ID destino inválido."); toast.error("Error interno al mover."); return; } newParentId = dropTargetId; }
    const newOrder = destinationIndex ?? 0;
    setTreeViewData(newTreeData); setError(null);
    menuService.updateMenuItem(dragSourceId, { padre_menu_id: newParentId, orden: newOrder })
    .then(() => { toast.success(`Menú movido.`); })
    .catch(err => { console.error("Error updating after drop:", err); setError("Error al guardar."); toast.error("Error al guardar orden."); if (selectedAreaId) { menuService.getMenuTreeByArea(selectedAreaId).then(backendTree => { const originalNodes = transformBackendDataToTreeNodes(backendTree); setTreeViewData(originalNodes); const idsToOpen = originalNodes.filter(n => n.droppable).map(n => n.id); setInitiallyOpenIds(idsToOpen); }).catch(() => toast.error("Error al recargar.")); } });
  }, [selectedAreaId, transformBackendDataToTreeNodes]);

  // --- Abrir Modales ---
  const handleOpenCreateModal = useCallback((parentNode: NodeModel<MenuNodeData> | null = null) => {
    setParentNodeForCreate(parentNode);
    setNewMenuData({ nombre: '', icono: '', ruta: '', es_activo: true });
    setIsSubmitting(false);
    setIsCreateModalOpen(true);
  }, []);

  const handleOpenEditModal = useCallback((node: NodeModel<MenuNodeData>) => {
    if (!node.data) {
        toast.error("No se pueden cargar los datos para editar.");
        return;
    }
    setEditingNodeData(node);
    // Inicializa el estado del formulario de edición
    setEditFormData({
        nombre: node.data.nombre ?? '', // Asegura string, aunque node.data.nombre debería serlo
        icono: node.data.icono ?? '',
        ruta: node.data.ruta ?? '',
        es_activo: node.data.es_activo,
    });
    setIsSubmitting(false);
    setIsEditModalOpen(true);
  }, []);

  // --- Activar/Desactivar Nodo ---
  const handleToggleActive = useCallback(async (node: NodeModel<MenuNodeData>) => {
    if (!node.data || typeof node.id !== 'number') { setError("Error interno."); toast.error("Error interno."); return; }
    const menuId = node.id; const currentStatus = node.data.es_activo; const action = currentStatus ? 'desactivar' : 'reactivar'; const originalData = [...treeViewData];
    setTreeViewData(prevData => prevData.map(n => n.id === menuId ? { ...n, data: { ...n.data!, es_activo: !currentStatus } } : n));
    try { currentStatus ? await menuService.deactivateMenuItem(menuId) : await menuService.reactivateMenuItem(menuId); toast.success(`Menú ${action}do.`); setError(null); }
    catch (err) { console.error(`Error al ${action}:`, err); setError(`Error al ${action}.`); toast.error(`Error al ${action}.`); setTreeViewData(originalData); }
  }, [treeViewData]);

  // --- Manejar cambios en formularios ---
  const handleNewMenuChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = event.target; const name = target.name; const value = target instanceof HTMLInputElement && target.type === 'checkbox' ? target.checked : target.value;
    setNewMenuData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditFormChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = event.target;
    const name = target.name;
    const value = target instanceof HTMLInputElement && target.type === 'checkbox' ? target.checked : target.value;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  // --- Manejar Envío de Formularios ---
  const handleCreateSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedAreaId) { toast.error("Selecciona área."); return; }
    if (!newMenuData.nombre.trim()) { toast.error("Nombre obligatorio."); return; }
    setIsSubmitting(true);
    const parentId = parentNodeForCreate ? parentNodeForCreate.id : null;
    if (parentId !== null && typeof parentId !== 'number') { toast.error("ID padre inválido."); setIsSubmitting(false); return; }
    const dataToSend: MenuCreateData = { ...newMenuData, area_id: selectedAreaId, padre_menu_id: parentId };
    try {
      const createdMenu = await menuService.createMenuItem(dataToSend);
      toast.success(`Menú "${createdMenu.nombre}" creado!`);
      const currentAreaId = selectedAreaId; setIsLoadingTree(true);
      const backendTree = await menuService.getMenuTreeByArea(currentAreaId);
      const transformedNodes = transformBackendDataToTreeNodes(backendTree);
      setTreeViewData(transformedNodes);
      const idsToOpen = transformedNodes.filter(n => n.droppable).map(n => n.id);
      setInitiallyOpenIds(idsToOpen); setIsLoadingTree(false);
      setIsCreateModalOpen(false);
    } catch (error: any) { console.error("Error creating:", error); const errorMsg = error?.response?.data?.detail || error.message || "No se pudo crear."; toast.error(`Error: ${errorMsg}`); }
    finally { setIsSubmitting(false); }
  };

  // *** CORRECCIÓN APLICADA EN LA VALIDACIÓN ***
  const handleEditSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingNodeData || typeof editingNodeData.id !== 'number') {
        toast.error("Error: No se encuentra el menú a editar.");
        return;
    }

    // --- CORRECCIÓN AQUÍ ---
    // Verifica explícitamente si nombre existe Y si no está vacío después de trim
    if (!editFormData.nombre || !editFormData.nombre.trim()) {
        toast.error("El nombre del menú es obligatorio.");
        return;
    }
    // --- FIN CORRECCIÓN ---

    setIsSubmitting(true);
    const menuIdToUpdate = editingNodeData.id;

    // Construye el objeto a enviar, asegurando null para campos opcionales vacíos
    const dataToSend: MenuUpdateData = {
        nombre: editFormData.nombre, // Ya validado que es un string no vacío
        icono: editFormData.icono || null,
        ruta: editFormData.ruta || null,
        es_activo: editFormData.es_activo,
    };

    try {
        const updatedMenu = await menuService.updateMenuItem(menuIdToUpdate, dataToSend);
        toast.success(`Menú "${updatedMenu.nombre}" actualizado.`);

        // Actualización optimista de la UI
        setTreeViewData(prevData =>
            prevData.map(node => {
                if (node.id === menuIdToUpdate) {
                    return {
                        ...node,
                        text: updatedMenu.nombre, // Actualiza el texto visible
                        data: {
                            ...node.data!, // Mantiene datos existentes no editados
                            ...updatedMenu, // Sobrescribe con los datos actualizados
                        },
                    };
                }
                return node;
            })
        );

        setIsEditModalOpen(false); // Cierra el modal
        setEditingNodeData(null); // Limpia el nodo en edición

    } catch (error: any) {
        console.error("Error updating menu item:", error);
        const errorMsg = error?.response?.data?.detail || error.message || "No se pudo actualizar el menú.";
        toast.error(`Error: ${errorMsg}`);
    } finally {
        setIsSubmitting(false);
    }
  };


  // --- Renderizado del Componente ---
  return (
      <div className="p-4 md:p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <h1 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-gray-200">Gestión de Menús por Área</h1>

        {/* Selector de Área */}
        <div className="mb-6 max-w-xs">
          <label htmlFor="area-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Seleccionar Área</label>
          {isLoadingAreas ? ( <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div> ) : areas.length > 0 ? (
            <select id="area-select" value={selectedAreaId ?? ''} onChange={handleAreaChange} className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
              <option value="" disabled>-- Seleccione un área --</option>
              {areas.map((area) => (<option key={area.area_id} value={area.area_id}>{area.nombre}</option>))}
            </select>
           ) : ( <p className="text-red-600 dark:text-red-400 text-sm mt-1">No se encontraron áreas.</p> )}
        </div>

        {/* Mensaje de Error General */}
        {error && ( <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 rounded">{error}</div> )}

        {/* Contenido Principal: Botón Añadir y Árbol */}
        {selectedAreaId !== null && (
          <>
            <div className="mb-4">
              <button onClick={() => handleOpenCreateModal(null)} className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50" disabled={isLoadingTree}>Añadir Menú Principal al Área</button>
            </div>

            {isLoadingTree ? ( <div className="flex items-center justify-center h-60 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800"><p className="text-gray-500 dark:text-gray-400">Cargando estructura...</p></div>
            ) : treeViewData.length > 0 ? (
              <div className="border border-gray-200 dark:border-gray-700 rounded-md p-3 min-h-[300px] bg-white dark:bg-gray-800 shadow-sm">
                <Tree<MenuNodeData>
                  ref={treeRef} tree={treeViewData} rootId={0} onDrop={handleDrop} initialOpen={initiallyOpenIds}
                  render={( node: NodeModel<MenuNodeData>, { depth, isOpen, onToggle }: RenderParams ) => {
                      const hasChildren = treeViewData.some(n => n.parent === node.id);
                      return (
                        <div style={{ marginLeft: depth * 16 }} className={`flex items-center justify-between py-1 px-2 rounded group hover:bg-gray-100 dark:hover:bg-gray-700 ${!node.data?.es_activo ? 'opacity-60 italic' : ''}`}>
                          {/* Contenido del nodo: icono, texto, estado */}
                          <div className="flex items-center truncate min-w-0">
                            <span style={{ width: '20px', textAlign: 'center', cursor: hasChildren ? 'pointer' : 'default' }} className="inline-block mr-1 text-gray-500 dark:text-gray-400 flex-shrink-0" onClick={hasChildren ? onToggle : undefined}>
                              {hasChildren ? (isOpen ? '▼' : '▶') : ''}
                            </span>
                            {node.data?.icono && ( <span className="mr-2 text-indigo-500 flex-shrink-0"><i className={node.data.icono}></i></span> )}
                            <span className="text-sm text-gray-800 dark:text-gray-200 truncate" title={node.text}>{node.text}</span>
                            {!node.data?.es_activo && <span className="ml-2 text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">(Inactivo)</span>}
                          </div>
                          {/* Botones de acción (visibles al hacer hover) */}
                          <div className="hidden group-hover:flex items-center space-x-1 flex-shrink-0 pl-2">
                             <button title="Añadir Submenú" onClick={(e) => { e.stopPropagation(); handleOpenCreateModal(node); }} className="p-1 rounded text-blue-500 hover:text-blue-700 hover:bg-blue-100 dark:hover:bg-gray-600">➕</button>
                             <button title="Editar" onClick={(e) => { e.stopPropagation(); handleOpenEditModal(node); }} className="p-1 rounded text-green-500 hover:text-green-700 hover:bg-green-100 dark:hover:bg-gray-600">✏️</button>
                             <button title={node.data?.es_activo ? 'Desactivar' : 'Activar'} onClick={(e) => { e.stopPropagation(); handleToggleActive(node); }} className={`p-1 rounded ${node.data?.es_activo ? 'text-red-500 hover:text-red-700 hover:bg-red-100' : 'text-yellow-500 hover:text-yellow-700 hover:bg-yellow-100'} dark:hover:bg-gray-600`}>👁️</button>
                          </div>
                        </div>
                      );
                  }}
                />
              </div>
            ) : ( <p className="text-gray-500 dark:text-gray-400 mt-4 text-sm">No hay menús para esta área.</p> )}
          </>
        )}

        {/* --- Modal de Creación --- */}
        {isCreateModalOpen && ( <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"> <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md"> <h2 className="text-xl mb-4 font-semibold text-gray-800 dark:text-gray-200">Crear Nuevo Menú</h2> <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">{parentNodeForCreate ? `Como submenú de: "${parentNodeForCreate.text}"` : 'Como menú principal.'}</p> <form onSubmit={handleCreateSubmit} id="create-menu-form"> <div className="mb-4"><label htmlFor="nombre" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre *</label><input type="text" id="nombre" name="nombre" value={newMenuData.nombre} onChange={handleNewMenuChange} required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" /></div> <div className="mb-4"><label htmlFor="icono" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Icono (Clase CSS)</label><input type="text" id="icono" name="icono" value={newMenuData.icono || ''} onChange={handleNewMenuChange} placeholder="Ej: fas fa-tachometer-alt" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" /></div> <div className="mb-4"><label htmlFor="ruta" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ruta (URL)</label><input type="text" id="ruta" name="ruta" value={newMenuData.ruta || ''} onChange={handleNewMenuChange} placeholder="Ej: /admin/usuarios" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" /></div> <div className="mb-4"><label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300"><input type="checkbox" name="es_activo" checked={newMenuData.es_activo} onChange={handleNewMenuChange} className="h-4 w-4 text-indigo-600 border-gray-300 dark:border-gray-600 rounded focus:ring-indigo-500 bg-white dark:bg-gray-700" /><span className="ml-2">Activo</span></label></div> <div className="mt-6 flex justify-end space-x-3"><button type="button" onClick={() => setIsCreateModalOpen(false)} disabled={isSubmitting} className="px-4 py-2 bg-gray-200 text-gray-800 text-sm font-medium rounded-md hover:bg-gray-300 disabled:opacity-50 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Cancelar</button><button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed">{isSubmitting ? 'Guardando...' : 'Guardar Menú'}</button></div> </form> </div> </div> )}

        {/* --- Modal de Edición (con ?? '' en inputs y validación corregida) --- */}
        {isEditModalOpen && editingNodeData && (
           <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
              <h2 className="text-xl mb-4 font-semibold text-gray-800 dark:text-gray-200">Editar Menú: {editingNodeData.text}</h2>
              <form onSubmit={handleEditSubmit} id="edit-menu-form">
                {/* Input Nombre */}
                <div className="mb-4">
                  <label htmlFor="edit-nombre" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre *</label>
                  <input
                    type="text" id="edit-nombre" name="nombre"
                    value={editFormData.nombre ?? ''} // Usa ?? '' para el renderizado seguro
                    onChange={handleEditFormChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
                {/* Input Icono */}
                <div className="mb-4">
                  <label htmlFor="edit-icono" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Icono (Clase CSS)</label>
                  <input
                    type="text" id="edit-icono" name="icono"
                    value={editFormData.icono ?? ''} // Usa ?? ''
                    onChange={handleEditFormChange}
                    placeholder="Ej: fas fa-cog"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
                {/* Input Ruta */}
                <div className="mb-4">
                  <label htmlFor="edit-ruta" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ruta (URL)</label>
                  <input
                    type="text" id="edit-ruta" name="ruta"
                    value={editFormData.ruta ?? ''} // Usa ?? ''
                    onChange={handleEditFormChange}
                    placeholder="Ej: /configuracion"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
                {/* Checkbox Activo */}
                <div className="mb-4">
                  <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox" name="es_activo"
                      checked={editFormData.es_activo}
                      onChange={handleEditFormChange}
                      className="h-4 w-4 text-indigo-600 border-gray-300 dark:border-gray-600 rounded focus:ring-indigo-500 bg-white dark:bg-gray-700"
                    />
                    <span className="ml-2">Activo</span>
                  </label>
                </div>
                {/* Botones del formulario */}
                <div className="mt-6 flex justify-end space-x-3">
                  <button type="button" onClick={() => { setIsEditModalOpen(false); setEditingNodeData(null); }} disabled={isSubmitting} className="px-4 py-2 bg-gray-200 text-gray-800 text-sm font-medium rounded-md hover:bg-gray-300 disabled:opacity-50 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Cancelar</button>
                  <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed">{isSubmitting ? 'Guardando...' : 'Guardar Cambios'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div> // Cierre del div principal
  );
};

export default MenuManagementPage;