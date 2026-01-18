import { message } from 'antd'
import { supabase } from './supabase'

export const softDelete = async (table: string, id: string) => {
  const { data, error } = await supabase
    .from(table)
    .update({ is_active: false })
    .eq('id', id)

  if (error) {
    message.error(error.message)
  } else {
    message.success('Deleted successfully')
  }
}

export const hardDelete = async (table: string, id: string) => {
  const { data, error } = await supabase
    .from(table)
    .delete()
    .eq('id', id)

  if (error) {
    message.error(error.message)
  } else {
    message.success('Deleted successfully')
  }
}
