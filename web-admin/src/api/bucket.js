import request from '@/utils/request'

export const getBuckets = () => {
  return request.get('/api/buckets')
}

export const getBucket = (name) => {
  return request.get(`/api/bucket/${name}`)
}

export const setBucketValue = (bucket, key, value) => {
  return request.post('/api/bucket', { bucket, key, value })
}

export const deleteBucketKey = (bucket, key) => {
  return request.delete(`/api/bucket/${bucket}/${key}`)
}

export const emptyBucket = (bucket) => {
  return request.post(`/api/bucket/${bucket}/empty`)
}
