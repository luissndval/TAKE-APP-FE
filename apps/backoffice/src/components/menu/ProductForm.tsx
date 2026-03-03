'use client';

import { useForm, useFieldArray, Controller, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Category } from '@/types/menu';
import { Plus, Trash2, ImageIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const productOptionSchema = z.object({
  name: z.string().min(1, 'Requerido'),
  price_delta: z.coerce.number(),
  is_available: z.boolean().default(true),
  position: z.number().default(0),
});

const productOptionGroupSchema = z.object({
  name: z.string().min(1, 'Requerido'),
  min_options: z.coerce.number().min(0),
  max_options: z.coerce.number().min(1),
  is_required: z.boolean().default(false),
  position: z.number().default(0),
  options: z.array(productOptionSchema).min(1, 'Al menos una opción requerida'),
});

const productSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  price: z.coerce.number().positive('El precio debe ser mayor a 0'),
  image_url: z.string().url('URL inválida').optional().or(z.literal('')),
  is_available: z.boolean(),
  category_id: z.string().uuid('Seleccioná una categoría'),
  stock_type: z.enum(['unlimited', 'finite', 'daily']),
  stock_quantity: z.coerce.number().min(0, 'No puede ser negativo'),
  low_stock_threshold: z.coerce.number().min(0).optional().nullable(),
  option_groups: z.array(productOptionGroupSchema).default([]),
});

export type ProductFormValues = z.infer<typeof productSchema>;

interface Props {
  categories: Category[];
  defaultValues?: Partial<ProductFormValues>;
  onSubmit: (data: ProductFormValues) => Promise<void>;
  isLoading?: boolean;
}

export default function ProductForm({ categories, defaultValues, onSubmit, isLoading }: Props) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema) as Resolver<ProductFormValues>,
    defaultValues: {
      is_available: true,
      stock_type: 'unlimited',
      stock_quantity: 0,
      option_groups: [],
      ...defaultValues,
    },
  });

  const { fields: groupFields, append: appendGroup, remove: removeGroup } = useFieldArray({ 
    control, 
    name: 'option_groups' 
  });
  
  const imageUrl = watch('image_url');
  const stockType = watch('stock_type');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Info básica */}
      <Card>
        <CardHeader>
          <CardTitle>Información básica</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Nombre *</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="Ej: Hamburguesa clásica"
              className={errors.name ? 'border-red-400' : ''}
            />
            {errors.name && (
              <p className="text-xs text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              {...register('description')}
              rows={3}
              placeholder="Descripción breve del producto..."
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="price">Precio (ARS) *</Label>
              <Input
                id="price"
                {...register('price')}
                type="number"
                step="0.01"
                placeholder="0.00"
                className={errors.price ? 'border-red-400' : ''}
              />
              {errors.price && (
                <p className="text-xs text-red-500">{errors.price.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Categoría *</Label>
              <Controller
                control={control}
                name="category_id"
                render={({ field }) => (
                  <Select value={field.value ?? ''} onValueChange={field.onChange}>
                    <SelectTrigger className={errors.category_id ? 'border-red-400' : ''}>
                      <SelectValue placeholder="Seleccioná una categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.category_id && (
                <p className="text-xs text-red-500">{errors.category_id.message}</p>
              )}
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Gestión de Stock */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Inventario</h3>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Tipo de stock</Label>
                <Controller
                  control={control}
                  name="stock_type"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unlimited">Infinito (Siempre disponible)</SelectItem>
                        <SelectItem value="finite">Finito (Se agota)</SelectItem>
                        <SelectItem value="daily">Diario (Se resetea cada día)</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              {stockType !== 'unlimited' && (
                <div className="space-y-1.5">
                  <Label htmlFor="stock_quantity">Cantidad actual</Label>
                  <Input
                    id="stock_quantity"
                    {...register('stock_quantity')}
                    type="number"
                    placeholder="0"
                  />
                </div>
              )}
            </div>

            {stockType !== 'unlimited' && (
              <div className="space-y-1.5">
                <Label htmlFor="low_stock_threshold">Umbral de stock bajo (opcional)</Label>
                <Input
                  id="low_stock_threshold"
                  {...register('low_stock_threshold')}
                  type="number"
                  placeholder="Ej: 5 (avisar cuando queden 5)"
                />
                <p className="text-[10px] text-gray-400">Te avisaremos cuando el stock baje de este número.</p>
              </div>
            )}
          </div>

          <hr className="border-gray-100" />

          <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-gray-900">Disponible</p>
              <p className="text-xs text-gray-500">Los clientes pueden pedir este producto</p>
            </div>
            <Controller
              control={control}
              name="is_available"
              render={({ field }) => (
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </div>
        </CardContent>
      </Card>

      {/* Grupos de Opciones */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Opciones y Extras</h3>
            <p className="text-sm text-gray-500">Personalizá cómo los clientes pueden configurar este producto.</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => appendGroup({ 
              name: '', min_options: 0, max_options: 1, is_required: false, options: [{ name: '', price_delta: 0 }] 
            })}
            className="gap-1.5"
          >
            <Plus size={14} />
            Agregar Grupo
          </Button>
        </div>

        {groupFields.map((group, groupIndex) => (
          <OptionGroupItem 
            key={group.id} 
            control={control} 
            register={register} 
            groupIndex={groupIndex} 
            onRemove={() => removeGroup(groupIndex)} 
          />
        ))}

        {groupFields.length === 0 && (
          <div className="rounded-xl border-2 border-dashed border-gray-200 p-8 text-center bg-gray-50">
            <Plus size={24} className="mx-auto text-gray-300 mb-2" />
            <p className="text-sm text-gray-400">No hay grupos de opciones. Agregá talles, sabores o ingredientes extra.</p>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3">
        <Button
          type="submit"
          disabled={isLoading || isSubmitting}
          size="lg"
          className="text-white"
          style={{ backgroundColor: "var(--backoffice-primary)" }}
        >
          {isLoading || isSubmitting ? 'Guardando...' : 'Guardar producto'}
        </Button>
      </div>
    </form>
  );
}

// ── Sub-component for Nested Options ───────────────────────────────────────

function OptionGroupItem({ control, register, groupIndex, onRemove }: any) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `option_groups.${groupIndex}.options`
  });

  return (
    <Card className="border-2 border-gray-100 shadow-none">
      <CardHeader className="bg-gray-50/50 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 max-w-sm">
            <Input 
              {...register(`option_groups.${groupIndex}.name`)}
              placeholder="Nombre del grupo (ej: Elegí tu pan)"
              className="font-bold border-none bg-transparent focus-visible:ring-0 p-0 h-auto text-base placeholder:text-gray-300"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={onRemove} className="text-red-400 hover:text-red-600">
              <Trash2 size={16} />
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4 mt-2">
          <div className="flex items-center gap-2">
            <Label className="text-[10px] uppercase font-bold text-gray-400">Min</Label>
            <Input {...register(`option_groups.${groupIndex}.min_options`)} type="number" className="w-16 h-7 text-xs px-2" />
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-[10px] uppercase font-bold text-gray-400">Max</Label>
            <Input {...register(`option_groups.${groupIndex}.max_options`)} type="number" className="w-16 h-7 text-xs px-2" />
          </div>
          <div className="flex items-center gap-2 border-l pl-4">
            <Controller
              control={control}
              name={`option_groups.${groupIndex}.is_required`}
              render={({ field }) => (
                <Switch checked={field.value} onCheckedChange={field.onChange} className="scale-75" />
              )}
            />
            <Label className="text-[10px] uppercase font-bold text-gray-400">Obligatorio</Label>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-3">
        {fields.map((option, optionIndex) => (
          <div key={option.id} className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full border-2 border-gray-200" />
            <Input 
              {...register(`option_groups.${groupIndex}.options.${optionIndex}.name`)}
              placeholder="Opción (ej: Pan Brioche)"
              className="flex-1 h-9 text-sm"
            />
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">$</span>
              <Input 
                {...register(`option_groups.${groupIndex}.options.${optionIndex}.price_delta`)}
                type="number"
                step="0.01"
                placeholder="0.00"
                className="w-24 h-9 text-sm pl-5"
              />
            </div>
            <button type="button" onClick={() => remove(optionIndex)} className="text-gray-300 hover:text-red-400 transition-colors">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => append({ name: '', price_delta: 0 })}
          className="w-full border border-dashed border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50 h-9 mt-2"
        >
          <Plus size={14} className="mr-1" /> Agregar Opción
        </Button>
      </CardContent>
    </Card>
  );
}
