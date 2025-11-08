import { HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  let cloned = req;
  // Attach token only for admin endpoints
  if (req.url.startsWith('/api/admin/')) {
    const token = auth.getToken();
    if (token) {
      cloned = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
    }
  }

  return next(cloned).pipe(
    catchError(err => {
      if (err && (err.status === 401 || err.status === 403)) {
        auth.logout();
        router.navigateByUrl('');
      }
      return throwError(() => err);
    })
  );
};
