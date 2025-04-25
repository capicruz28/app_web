// src/components/admin/RolePermissionsManager.tsx (SIMPLIFICADO PARA 'VER')
import axios from 'axios';
import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Loader, AlertCircle } from 'lucide-react';

// --- Importar componentes de shadcn/ui ---
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

// --- Importar servicios REALES ---
import { menuService } from '@/services/menu.service';
import { permissionService } from '@/services/permission.service';

// --- Importar tipos REALES ---
import type { MenuItem } from '@/types/menu.types';
// Mantenemos los tipos completos por ahora, aunque solo usemos 'ver' en la UI
import type { PermissionState } from '@/types/permission.types';

// --- Props del componente ---
interface RolePermissionsManagerProps {
  isOpen: boolean;
  rolId: number;
  rolName: string;
  onClose: () => void;
  onPermissionsUpdate?: () => void;
}

const RolePermissionsManager: React.FC<RolePermissionsManagerProps> = ({
  isOpen,
  rolId,
  rolName,
  onClose,
  onPermissionsUpdate,
}) => {
  // --- Estados Internos (mantenemos estructura completa) ---
  const [menuTree, setMenuTree] = useState<MenuItem[]>([]);
  const [permissions, setPermissions] = useState<PermissionState>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // --- Cargar datos (sin cambios) ---
  const loadData = useCallback(async () => {
    if (!rolId) return;
    setIsLoading(true);
    setError(null);
    setMenuTree([]);
    setPermissions({});
    try {
      console.log(`Cargando datos para rol ID: ${rolId}`);
      const [menuData, permissionsData] = await Promise.all([
        menuService.getFullMenuTree(),
        permissionService.getRolePermissions(rolId),
      ]);
      console.log("Menu Tree Data:", menuData);
      console.log("Permissions Data:", permissionsData);
      setMenuTree(menuData);
      setPermissions(permissionsData);
    } catch (err) {
      console.error("Error loading permissions data:", err);
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar datos de permisos.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [rolId]);

  // --- Efecto para cargar datos (sin cambios) ---
  useEffect(() => {
    if (isOpen && rolId) {
      loadData();
    } else {
      setMenuTree([]);
      setPermissions({});
      setError(null);
      setIsLoading(false);
      setIsSaving(false);
    }
  }, [isOpen, rolId, loadData]);

  // --- Handler para cambiar SOLO el permiso 'ver' ---
  const handleViewPermissionChange = (menuId: number, checked: boolean) => {
    setPermissions(prev => {
      const updatedPermissions = { ...prev };
      // Asegurarse de que el objeto para menuId exista
      if (!updatedPermissions[menuId]) {
        updatedPermissions[menuId] = { ver: false, crear: false, editar: false, eliminar: false };
      }
      // Actualizar 'ver'
      updatedPermissions[menuId].ver = checked;

      // Si desmarcamos 'ver', desmarcamos los otros en el estado (aunque no se vean)
      if (!checked) {
          updatedPermissions[menuId].crear = false;
          updatedPermissions[menuId].editar = false;
          updatedPermissions[menuId].eliminar = false;
      }
      // No necesitamos la lógica inversa (marcar 'ver' si se marca otro) porque solo manejamos 'ver'

      return updatedPermissions;
    });
  };

  // --- Handler para guardar los cambios (sin cambios, envía el estado completo) ---
  const handleSaveChanges = async () => {
    setIsSaving(true);
    setError(null);
    try {
        // --- INICIO: Transformar estado a formato de array esperado por el backend ---
        const permisosArray = Object.entries(permissions).map(([menuIdStr, perms]) => {
            // Convertir la clave string a número
            const menu_id = parseInt(menuIdStr, 10);

            // Mapear nombres de frontend ('ver') a backend ('puede_ver')
            // y excluir 'crear' si aún estuviera presente accidentalmente
            return {
                menu_id: menu_id,
                puede_ver: perms.ver,
                puede_editar: perms.editar, // Incluir aunque no se muestre en UI
                puede_eliminar: perms.eliminar, // Incluir aunque no se muestre en UI
            };
        }).filter(p => !isNaN(p.menu_id)); // Filtrar por si acaso hubo un error en parseInt

        console.log(`Enviando permisos para rol ID: ${rolId}`, permisosArray); // Log del array transformado

        // Crear el payload final con la clave "permisos" y el array como valor
        const payload = { permisos: permisosArray };
        // --- FIN: Transformar estado a formato de array ---


        // Llamada real al servicio con el payload transformado
        // Nota: El tipo PermissionUpdatePayload puede necesitar ajuste si quieres
        //       máxima corrección de tipos, pero el envío funcionará.
        await permissionService.updateRolePermissions(rolId, payload as any); // Usamos 'as any' por simplicidad aquí

        toast.success(`Permisos para el rol "${rolName}" actualizados.`);
        onPermissionsUpdate?.();
        onClose();

    } catch (err) {
        console.error("Error saving permissions:", err);
        // Mantenemos el manejo de errores mejorado
        let errorMessage = 'Error al guardar los permisos.';
        if (axios.isAxiosError(err) && err.response?.status === 422 && err.response.data?.detail) {
             try {
                 const details = err.response.data.detail;
                 if (Array.isArray(details)) {
                     errorMessage = details.map(e => `${e.loc?.join('.')}: ${e.msg}`).join('; ');
                 } else if (typeof details === 'string') {
                     errorMessage = details;
                 }
             } catch (parseError) { /* Ignorar */ }
        } else if (err instanceof Error) {
            errorMessage = err.message;
        }

        setError(errorMessage);
        toast.error(errorMessage);
    } finally {
        setIsSaving(false);
    }
  };

  // --- Función recursiva para renderizar el árbol (SOLO CON CHECKBOX 'VER') ---
  const renderMenuNode = (node: MenuItem, level: number = 0): JSX.Element => {
    // Obtener permisos para este nodo, o usar valores por defecto
    const nodePermissions = permissions[node.menu_id] || { ver: false, crear: false, editar: false, eliminar: false };
    const indentClass = `ml-${level * 6}`;

    return (
      <div key={node.menu_id} className={`py-2 ${indentClass}`}>
        <div className="flex items-center justify-between mb-1">
          {/* Nombre del Menú */}
          <span className="font-medium text-sm text-gray-800 dark:text-gray-200">{node.nombre}</span>

          {/* Checkbox ÚNICO para 'Ver' */}
          <div className="flex items-center mr-8"> {/* Ajustar margen si es necesario */}
            <Checkbox
              id={`perm-${node.menu_id}-ver`}
              checked={nodePermissions.ver} // Acceder directamente a 'ver'
              onCheckedChange={(checked) => handleViewPermissionChange(node.menu_id, !!checked)}
              disabled={isLoading || isSaving}
              aria-label={`Permiso de Ver para ${node.nombre}`}
            />
            {/* Podríamos añadir un Label si queremos texto explícito */}
            {/* <Label htmlFor={`perm-${node.menu_id}-ver`} className="text-xs text-gray-600 dark:text-gray-400 cursor-pointer ml-2">
              Ver
            </Label> */}
          </div>
        </div>
        {/* Renderizar hijos recursivamente */}
        {node.children && node.children.length > 0 && (
          <div className="border-l border-gray-200 dark:border-gray-700 pl-3">
            {node.children.map(child => renderMenuNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // --- Renderizado del Componente ---
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSaving && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col dark:bg-gray-800"> {/* Ajustado tamaño a lg */}
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-white">Gestionar Visibilidad para Rol: <span className="font-bold">{rolName}</span></DialogTitle>
          <DialogDescription className="dark:text-gray-400">
            Selecciona los menús que este rol podrá visualizar.
          </DialogDescription>
        </DialogHeader>

        {/* Contenido Principal (Árbol de Permisos Simplificado) */}
        <div className="flex-grow overflow-y-auto pr-2 py-4 space-y-2">
          {isLoading && (
            <div className="flex justify-center items-center h-40">
              <Loader className="animate-spin h-8 w-8 text-indigo-600" />
              <p className="ml-3 text-gray-500 dark:text-gray-400">Cargando estructura y permisos...</p>
            </div>
          )}
          {!isLoading && error && !isSaving && (
             <div className="flex justify-center items-center h-40 text-center text-red-600 dark:text-red-400">
                <AlertCircle className="h-6 w-6 mr-2"/> {error}
             </div>
          )}
          {!isLoading && !error && menuTree.length === 0 && (
             <div className="flex justify-center items-center h-40 text-gray-500 dark:text-gray-400">
                No se encontró la estructura del menú.
             </div>
          )}
          {!isLoading && !error && menuTree.length > 0 && (
            <div>
                {/* YA NO HAY CABECERA DE PERMISOS (V C E D) */}
                {/* Renderizar el árbol */}
                {menuTree.map(node => renderMenuNode(node))}
            </div>
          )}
        </div>

        {/* Footer con Botones (sin cambios) */}
        <DialogFooter className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700">
           {error && isSaving && <p className="text-sm text-red-600 dark:text-red-400 mr-auto">{error}</p>}
          <DialogClose asChild>
            <Button variant="outline" onClick={onClose} disabled={isSaving} className="dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700">
              Cancelar
            </Button>
          </DialogClose>
          <Button
            type="button"
            onClick={handleSaveChanges}
            disabled={isLoading || isSaving || menuTree.length === 0}
            className="bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50"
          >
            {isSaving && <Loader className="animate-spin h-4 w-4 mr-2" />}
            {isSaving ? 'Guardando...' : 'Guardar Visibilidad'} {/* Texto del botón actualizado */}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RolePermissionsManager;